import type { FeedPost } from "@/server/community/service";
import seed from "../../../seed/content.json";

/** The prototype's sample posts, shown (labeled "Example") only until real parents have posted. Pure data. */
export const EXAMPLE_POSTS: FeedPost[] = (seed as { communitySeed: { name: string; text: string }[] }).communitySeed.map((p, i) => ({
  id: `example-${i + 1}`, displayName: p.name, body: p.text, createdAt: new Date(0), isMine: false, held: false, example: true, helpful: { count: 0, mine: false }, replies: [],
}));
