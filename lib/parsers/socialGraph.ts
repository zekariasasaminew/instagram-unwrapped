// Port of the SOCIAL GRAPH section of instagram_analysis.py.
import type { ZipEntry } from "../zip/zipReader";
import { pamBlocks } from "../utils/htmlBlocks";
import type { SocialGraph } from "../types";

async function readNamesList(
  byFilename: Map<string, ZipEntry>,
  path: string
): Promise<Set<string>> {
  const entry = byFilename.get(path);
  if (!entry) return new Set();
  const html = await entry.getText();
  const names = new Set<string>();
  for (const { header } of pamBlocks(html)) {
    if (header) names.add(header);
  }
  return names;
}

export async function parseSocialGraph(entries: ZipEntry[]): Promise<SocialGraph> {
  const byFilename = new Map(entries.map((e) => [e.filename, e]));
  const base = "connections/followers_and_following/";

  const [following, followers, closeFriends, blocked, recentlyUnfollowed] = await Promise.all([
    readNamesList(byFilename, `${base}following.html`),
    readNamesList(byFilename, `${base}followers_1.html`),
    readNamesList(byFilename, `${base}close_friends.html`),
    readNamesList(byFilename, `${base}blocked_profiles.html`),
    readNamesList(byFilename, `${base}recently_unfollowed_profiles.html`),
  ]);

  const notFollowingBack = [...following].filter((u) => !followers.has(u));
  const notFollowedBack = [...followers].filter((u) => !following.has(u));

  return {
    followers_count: followers.size,
    following_count: following.size,
    close_friends_count: closeFriends.size,
    blocked_count: blocked.size,
    recently_unfollowed_count: recentlyUnfollowed.size,
    not_following_back_count: notFollowingBack.length,
    not_followed_back_count: notFollowedBack.length,
    not_following_back_list: notFollowingBack.sort(),
  };
}
