import { TooltipProvider } from "@/components/charts/Tooltip";
import { Overview } from "./Overview";
import { MessagesOverTime } from "./MessagesOverTime";
import { YearBreakdown } from "./YearBreakdown";
import { TopContacts } from "./TopContacts";
import { HeatmapCard } from "./HeatmapCard";
import { WordFrequency } from "./WordFrequency";
import { NonFillerWords } from "./NonFillerWords";
import { EngagementLeaderboard } from "./EngagementLeaderboard";
import { FunFacts } from "./FunFacts";
import { EmojiList } from "./EmojiList";
import { ReplySpeed } from "./ReplySpeed";
import { RecentSearches } from "./RecentSearches";
import { AIInterests } from "./AIInterests";
import { Shopping } from "./Shopping";
import { SocialGraph } from "./SocialGraph";
import { ActivityTotals } from "./ActivityTotals";
import { Ads } from "./Ads";
import { Security } from "./Security";
import type { Summary } from "@/lib/types";

export function Dashboard({ summary, onReset }: { summary: Summary; onReset?: () => void }) {
  return (
    <TooltipProvider>
      <div className="viz-root">
        <div className="wrap">
          <h1>Your Instagram Account, Distilled</h1>
          <p className="subtitle">
            Generated locally from your Instagram data export. Message content was only used to
            compute aggregate counts &mdash; no raw message text is stored anywhere in this
            report.
            {onReset && (
              <>
                {" "}
                <button className="btn" onClick={onReset} style={{ marginLeft: 8 }}>
                  Analyze a different export
                </button>
              </>
            )}
          </p>

          <Overview summary={summary} />

          <MessagesOverTime data={summary.messages_per_month} />

          <YearBreakdown
            messagesPerYear={summary.messages_per_year}
            contactYearBreakdown={summary.contact_year_breakdown}
          />

          <div className="grid grid-2">
            <TopContacts contacts={summary.top_contacts} />
            <HeatmapCard data={summary.heatmap} />
          </div>

          <WordFrequency
            topWordsYou={summary.top_words_you}
            topWordsReplies={summary.top_words_replies}
            topWordsByYear={summary.top_words_by_year}
          />

          <NonFillerWords
            topWordsYouNonfiller={summary.top_words_you_nonfiller}
            topWordsRepliesNonfiller={summary.top_words_replies_nonfiller}
          />

          <EngagementLeaderboard data={summary.engagement_leaderboard} />

          <div className="grid grid-3">
            <FunFacts milestones={summary.milestones} longestStreak={summary.longest_streak} />
            <EmojiList data={summary.top_emoji} />
            <ReplySpeed data={summary.reply_speed} />
          </div>

          <div className="grid grid-3">
            <RecentSearches data={summary.recent_searches} />
            <AIInterests data={summary.ai_interests} />
            <Shopping data={summary.shopping_recently_viewed} />
          </div>

          <div className="grid grid-2">
            <SocialGraph data={summary.social_graph} />
            <ActivityTotals data={summary.activity_totals} />
          </div>

          <div className="grid grid-2">
            <Ads data={summary.ads} />
            <Security security={summary.security} ads={summary.ads} />
          </div>

          <p className="footnote">
            Built entirely offline from your data export. Nothing in this report was uploaded
            anywhere.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
