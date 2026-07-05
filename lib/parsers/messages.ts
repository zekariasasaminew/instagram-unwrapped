// Port of the MESSAGES section of instagram_analysis.py, plus the
// reply_speed join that originally lived in build_dashboard.py (folded in
// here so the whole pipeline is one pass).
import type { ZipEntry } from "../zip/zipReader";
import { pamBlocks } from "../utils/htmlBlocks";
import { parseTimestamp, stripAllTimestamps } from "../utils/date";
import { STOPWORDS, EXTRA_FILLER, EMOJI_RE, WORD_RE, URL_RE, SYSTEM_MSG_RE } from "../utils/text";
import { bump, topN, median, round1, localDateKey, localMonthKey, toLocalIso, pyWeekday } from "../utils/agg";
import type {
  Contact,
  WordCount,
  EmojiUsage,
  HeatmapCell,
  MonthCount,
  YearCount,
  ContactYearBreakdown,
  Milestones,
  LongestStreak,
  ReplySpeedEntry,
} from "../types";

const THREAD_RE = /^your_instagram_activity\/messages\/inbox\/([^/]+)\/message_\d+\.html$/;

interface RawMessage {
  threadId: string;
  sender: string;
  dt: Date;
  content: string;
}

interface ThreadStat {
  participants: Set<string>;
  total: number;
  fromYou: number;
  fromThem: number;
}

export interface MessagesResult {
  topContacts: Contact[];
  topWordsYou: WordCount[];
  topWordsReplies: WordCount[];
  topWordsYouNonfiller: WordCount[];
  topWordsRepliesNonfiller: WordCount[];
  topWordsByYear: Record<string, { you: WordCount[]; them: WordCount[] }>;
  topEmoji: EmojiUsage[];
  heatmap: HeatmapCell[];
  messagesPerMonth: MonthCount[];
  messagesPerYear: YearCount[];
  contactYearBreakdown: ContactYearBreakdown;
  milestones: Milestones;
  longestStreak: LongestStreak;
  replySpeed: ReplySpeedEntry[];
}

export async function parseMessages(
  entries: ZipEntry[],
  onProgress?: (processed: number, total: number) => void
): Promise<MessagesResult> {
  const threadFiles = new Map<string, ZipEntry[]>();
  for (const entry of entries) {
    const m = THREAD_RE.exec(entry.filename);
    if (m) {
      const list = threadFiles.get(m[1]) ?? [];
      list.push(entry);
      threadFiles.set(m[1], list);
    }
  }

  const allMessages: RawMessage[] = [];
  let processed = 0;
  const totalFiles = [...threadFiles.values()].reduce((s, l) => s + l.length, 0);
  for (const [threadId, files] of threadFiles) {
    for (const file of files) {
      const html = await file.getText();
      for (const { header, timestamp, content } of pamBlocks(html)) {
        const dt = parseTimestamp(timestamp);
        if (dt === null || !header) continue;
        allMessages.push({ threadId, sender: header, dt, content });
      }
      processed++;
      onProgress?.(processed, totalFiles);
    }
  }

  // Determine "you" = sender appearing across the most distinct threads.
  const senderThreads = new Map<string, Set<string>>();
  for (const m of allMessages) {
    const set = senderThreads.get(m.sender) ?? new Set<string>();
    set.add(m.threadId);
    senderThreads.set(m.sender, set);
  }
  let youName = "";
  let maxThreadCount = -1;
  for (const [sender, threads] of senderThreads) {
    if (threads.size > maxThreadCount) {
      maxThreadCount = threads.size;
      youName = sender;
    }
  }

  // Per-thread aggregation.
  const threadStats = new Map<string, ThreadStat>();
  for (const m of allMessages) {
    let ts = threadStats.get(m.threadId);
    if (!ts) {
      ts = { participants: new Set(), total: 0, fromYou: 0, fromThem: 0 };
      threadStats.set(m.threadId, ts);
    }
    ts.total++;
    if (m.sender === youName) {
      ts.fromYou++;
    } else {
      ts.fromThem++;
      ts.participants.add(m.sender);
    }
  }

  const contactsRows = [...threadStats.entries()]
    .map(([threadId, s]) => ({
      threadId,
      participant: s.participants.size
        ? [...s.participants].sort().join(", ")
        : "(you only / unknown)",
      isGroup: s.participants.size > 1,
      totalMessages: s.total,
    }))
    .sort((a, b) => b.totalMessages - a.totalMessages);

  const topContacts: Contact[] = contactsRows
    .filter((r) => !r.isGroup)
    .slice(0, 25)
    .map((r) => ({ participant: r.participant, total_messages: r.totalMessages }));

  // Word frequency by year & by sender, emoji usage, and the activity heatmap.
  const wordYearYou = new Map<number, Map<string, number>>();
  const wordYearThem = new Map<number, Map<string, number>>();
  const wordOverallYou = new Map<string, number>();
  const wordOverallThem = new Map<string, number>();
  const emojiYou = new Map<string, number>();
  const emojiThem = new Map<string, number>();
  const heatmapCounts = new Map<string, number>(); // `${weekday}_${hour}` -> count
  const dayCounts = new Map<string, number>(); // "YYYY-MM-DD" -> count

  function bumpYearWord(map: Map<number, Map<string, number>>, year: number, word: string) {
    let m = map.get(year);
    if (!m) {
      m = new Map();
      map.set(year, m);
    }
    bump(m, word);
  }

  for (const { sender, dt, content } of allMessages) {
    const year = dt.getFullYear();
    bump(heatmapCounts, `${pyWeekday(dt)}_${dt.getHours()}`);
    bump(dayCounts, localDateKey(dt));

    const isYou = sender === youName;
    const emojis = content.match(EMOJI_RE) ?? [];
    for (const e of emojis) bump(isYou ? emojiYou : emojiThem, e);

    if (!content || SYSTEM_MSG_RE.test(content)) continue;
    let contentClean = content.replace(URL_RE, " ");
    contentClean = stripAllTimestamps(contentClean);
    const words = (contentClean.match(WORD_RE) ?? [])
      .map((w) => w.toLowerCase())
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
    if (words.length === 0) continue;

    if (isYou) {
      for (const w of words) {
        bumpYearWord(wordYearYou, year, w);
        bump(wordOverallYou, w);
      }
    } else {
      for (const w of words) {
        bumpYearWord(wordYearThem, year, w);
        bump(wordOverallThem, w);
      }
    }
  }

  const years = [...new Set([...wordYearYou.keys(), ...wordYearThem.keys()])].sort((a, b) => a - b);
  const topWordsByYear: Record<string, { you: WordCount[]; them: WordCount[] }> = {};
  for (const year of years) {
    topWordsByYear[String(year)] = {
      you: topN(wordYearYou.get(year) ?? new Map(), 10),
      them: topN(wordYearThem.get(year) ?? new Map(), 10),
    };
  }

  const topWordsYou = topN(wordOverallYou, 20);
  const topWordsReplies = topN(wordOverallThem, 20);

  // Non-filler word frequency: exclude everything already surfaced above,
  // plus common interjections/slang that rank just below them.
  const alreadyShown = new Set([
    ...topN(wordOverallYou, 50).map((w) => w.word),
    ...topN(wordOverallThem, 50).map((w) => w.word),
  ]);
  const fillerExclude = new Set<string>([...STOPWORDS, ...alreadyShown, ...EXTRA_FILLER]);
  const nonfillerYou = new Map([...wordOverallYou].filter(([w]) => !fillerExclude.has(w)));
  const nonfillerThem = new Map([...wordOverallThem].filter(([w]) => !fillerExclude.has(w)));
  const topWordsYouNonfiller = topN(nonfillerYou, 20);
  const topWordsRepliesNonfiller = topN(nonfillerThem, 20);

  const emojiKeys = new Set([...emojiYou.keys(), ...emojiThem.keys()]);
  const topEmoji: EmojiUsage[] = [...emojiKeys]
    .map((e) => ({
      emoji: e,
      used_by_you: emojiYou.get(e) ?? 0,
      used_by_them: emojiThem.get(e) ?? 0,
    }))
    .sort((a, b) => b.used_by_you + b.used_by_them - (a.used_by_you + a.used_by_them))
    .slice(0, 15);

  const heatmap: HeatmapCell[] = [...heatmapCounts.entries()].map(([key, count]) => {
    const [wd, hr] = key.split("_").map(Number);
    return { weekday: wd, hour: hr, count };
  });

  const monthCounts = new Map<string, number>();
  for (const m of allMessages) bump(monthCounts, localMonthKey(m.dt));
  const messagesPerMonth: MonthCount[] = [...monthCounts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Yearly totals + per-contact-per-year breakdown + active-thread counts.
  const yearTotals = new Map<number, number>();
  const yearThreadSets = new Map<number, Set<string>>();
  const contactYearCounts = new Map<string, Map<number, number>>();
  for (const m of allMessages) {
    const year = m.dt.getFullYear();
    bump(yearTotals, year);
    let set = yearThreadSets.get(year);
    if (!set) {
      set = new Set();
      yearThreadSets.set(year, set);
    }
    set.add(m.threadId);
    const stat = threadStats.get(m.threadId)!;
    if (stat.participants.size === 1) {
      const name = [...stat.participants][0];
      let cy = contactYearCounts.get(name);
      if (!cy) {
        cy = new Map();
        contactYearCounts.set(name, cy);
      }
      bump(cy, year);
    }
  }
  const sortedYears = [...yearTotals.keys()].sort((a, b) => a - b);
  const messagesPerYear: YearCount[] = sortedYears.map((y) => ({
    year: y,
    count: yearTotals.get(y) ?? 0,
    active_threads: (yearThreadSets.get(y) ?? new Set()).size,
  }));

  const topContactNames = contactsRows
    .filter((r) => !r.isGroup)
    .slice(0, 12)
    .map((r) => r.participant);
  const contactYearBreakdown: ContactYearBreakdown = {
    years: sortedYears,
    contacts: topContactNames.map((name) => ({
      participant: name,
      by_year: sortedYears.map((y) => contactYearCounts.get(name)?.get(y) ?? 0),
    })),
  };

  // Milestones.
  let busiestDay = "";
  let busiestCount = -1;
  for (const [day, count] of dayCounts) {
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = day;
    }
  }
  const firstMessageEver = allMessages.reduce<Date | null>(
    (min, m) => (min === null || m.dt < min ? m.dt : min),
    null
  );
  const milestones: Milestones = {
    first_message_ever: firstMessageEver ? toLocalIso(firstMessageEver) : null,
    busiest_day: busiestDay,
    busiest_day_count: busiestCount,
    total_messages: allMessages.length,
    total_threads: threadStats.size,
    you_name: youName,
  };

  // Longest daily streak with any single contact.
  const threadDateSets = new Map<string, Set<string>>();
  for (const m of allMessages) {
    let set = threadDateSets.get(m.threadId);
    if (!set) {
      set = new Set();
      threadDateSets.set(m.threadId, set);
    }
    set.add(localDateKey(m.dt));
  }
  let longestStreak: LongestStreak = { participant: null, days: 0 };
  for (const [threadId, dateSet] of threadDateSets) {
    const dates = [...dateSet].sort();
    if (!dates.length) continue;
    let longest = 1;
    let cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.round(
        (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000
      );
      if (diffDays === 1) {
        cur++;
        longest = Math.max(longest, cur);
      } else {
        cur = 1;
      }
    }
    if (longest > longestStreak.days) {
      const stat = threadStats.get(threadId)!;
      const participant = stat.participants.size === 1 ? [...stat.participants][0] : threadId;
      longestStreak = { participant, days: longest };
    }
  }

  // Response times per contact (1:1 threads only), then filter to contacts
  // with enough volume for the median to be meaningful - this is the join
  // that used to live in build_dashboard.py, folded into the same pass here.
  const threadMessages = new Map<string, RawMessage[]>();
  for (const m of allMessages) {
    const list = threadMessages.get(m.threadId) ?? [];
    list.push(m);
    threadMessages.set(m.threadId, list);
  }
  const totalsByParticipant = new Map<string, number>();
  for (const r of contactsRows) {
    if (!r.isGroup) totalsByParticipant.set(r.participant, r.totalMessages);
  }

  const replySpeed: ReplySpeedEntry[] = [];
  for (const [threadId, msgs] of threadMessages) {
    const stat = threadStats.get(threadId)!;
    if (stat.participants.size !== 1) continue;
    const sorted = [...msgs].sort((a, b) => a.dt.getTime() - b.dt.getTime());
    if (sorted.length < 2) continue;
    const yourDeltas: number[] = [];
    const theirDeltas: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (prev.sender === cur.sender) continue;
      const deltaMin = (cur.dt.getTime() - prev.dt.getTime()) / 60_000;
      if (deltaMin < 0 || deltaMin > 60 * 24 * 14) continue; // ignore gaps > 2 weeks
      if (cur.sender === youName) yourDeltas.push(deltaMin);
      else theirDeltas.push(deltaMin);
    }
    if (!yourDeltas.length && !theirDeltas.length) continue;
    const participant = [...stat.participants][0];
    const totalMessages = totalsByParticipant.get(participant) ?? 0;
    const theirMedian = theirDeltas.length ? round1(median(theirDeltas)) : null;
    if (totalMessages < 100 || theirMedian === null) continue;
    replySpeed.push({
      participant,
      their_median_reply_min: theirMedian,
      your_median_reply_min: yourDeltas.length ? round1(median(yourDeltas)) : null,
      total_messages: totalMessages,
    });
  }

  return {
    topContacts,
    topWordsYou,
    topWordsReplies,
    topWordsYouNonfiller,
    topWordsRepliesNonfiller,
    topWordsByYear,
    topEmoji,
    heatmap,
    messagesPerMonth,
    messagesPerYear,
    contactYearBreakdown,
    milestones,
    longestStreak,
    replySpeed,
  };
}
