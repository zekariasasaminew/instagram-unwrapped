// Shared shape produced by the parsing pipeline and consumed by the dashboard UI.
// Mirrors the Python prototype's summary.json exactly so the two are easy to diff.

export interface WordCount {
  word: string;
  count: number;
}

export interface Contact {
  participant: string;
  total_messages: number;
}

export interface EmojiUsage {
  emoji: string;
  used_by_you: number;
  used_by_them: number;
}

export interface HeatmapCell {
  weekday: number; // 0 = Monday .. 6 = Sunday
  hour: number; // 0-23
  count: number;
}

export interface MonthCount {
  month: string; // YYYY-MM
  count: number;
}

export interface YearCount {
  year: number;
  count: number;
  active_threads: number;
}

export interface ContactYearBreakdown {
  years: number[];
  contacts: { participant: string; by_year: number[] }[];
}

export interface Milestones {
  first_message_ever: string | null;
  busiest_day: string;
  busiest_day_count: number;
  total_messages: number;
  total_threads: number;
  you_name: string;
}

export interface LongestStreak {
  participant: string | null;
  days: number;
}

export interface SocialGraph {
  followers_count: number;
  following_count: number;
  close_friends_count: number;
  blocked_count: number;
  recently_unfollowed_count: number;
  not_following_back_count: number;
  not_followed_back_count: number;
  not_following_back_list: string[];
}

export interface AdsInfo {
  advertiser_count: number;
  top_advertisers: string[];
  topic_counts: Record<string, number>;
  off_meta_company_count: number;
  off_meta_event_count: number;
  top_off_meta_companies: { company: string; events: number }[];
}

export interface PrivacyChange {
  change: string;
  time: string;
}

export interface SecurityInfo {
  account_created: string | null;
  account_age_days: number | null;
  login_count: number;
  distinct_ip_count: number;
  password_change_count: number;
  privacy_changes: PrivacyChange[];
}

export interface RecentSearches {
  total: number;
  top_queries: { query: string; count: number }[];
  most_recent: { query: string; time: string }[];
}

export interface AiInterest {
  interest: string;
  time: string;
}

export interface EngagementEntry {
  who: string;
  count: number;
}

export interface ReplySpeedEntry {
  participant: string;
  their_median_reply_min: number | null;
  your_median_reply_min: number | null;
  total_messages: number;
}

export interface Summary {
  top_contacts: Contact[];
  top_words_you: WordCount[];
  top_words_replies: WordCount[];
  top_words_you_nonfiller: WordCount[];
  top_words_replies_nonfiller: WordCount[];
  top_words_by_year: Record<string, { you: WordCount[]; them: WordCount[] }>;
  top_emoji: EmojiUsage[];
  heatmap: HeatmapCell[];
  messages_per_month: MonthCount[];
  messages_per_year: YearCount[];
  contact_year_breakdown: ContactYearBreakdown;
  milestones: Milestones;
  longest_streak: LongestStreak;
  activity_totals: Record<string, number>;
  social_graph: SocialGraph;
  ads: AdsInfo;
  security: SecurityInfo;
  recent_searches: RecentSearches;
  ai_interests: AiInterest[];
  shopping_recently_viewed: string[];
  engagement_leaderboard: EngagementEntry[];
  reply_speed: ReplySpeedEntry[];
  skipped_files: number;
}

export type WorkerRequest = { type: "parse"; file: File };

export type WorkerResponse =
  | { type: "progress"; phase: string; processed: number; total: number }
  | { type: "result"; summary: Summary }
  | { type: "error"; phase: string; message: string; fatal: boolean };
