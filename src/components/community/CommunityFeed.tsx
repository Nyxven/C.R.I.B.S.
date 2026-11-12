"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, HandHeart, Trash2 } from "lucide-react";
import { createPostAction, deletePostAction, loadMoreAction, reportPostAction, setHelpfulAction } from "@/features/community/actions";
import { POST_MAX, REASON_LABELS, REPORT_REASONS } from "@/lib/community/rules";
import { timeAgo } from "@/lib/notifications/rules";
import type { FeedPost } from "@/server/community/service";

type Msg = { ok: boolean; text: string };
const when = (d: Date) => timeAgo(new Date(d), new Date());

function Composer({ parentId, onDone, label }: { parentId?: string; onDone: () => void; label: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createPostAction({ body, anonymous, parentId }); if (r.ok) { setBody(""); setMsg({ ok: true, text: "" }); onDone(); } else setMsg({ ok: false, text: r.error }); }); }}>
      <label className="block"><span className="sr-only">{label}</span>
        <textarea className="field min-h-24 w-full" maxLength={POST_MAX} placeholder={label} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post as anonymous</label>
        <button className="btn-primary" disabled={pending || body.trim().length < 3}>{parentId ? "Reply" : "Post"}</button>
      </div>
      <p role="status" className={`min-h-5 font-bold ${msg.ok ? "" : "text-coral-dark"}`}>{msg.text}</p>
    </form>
  );
}

function PostCard({ p, isReply, onChanged }: { p: FeedPost; isReply?: boolean; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const [helpful, setHelpful] = useState(p.helpful);
  const [replying, setReplying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });

  if (p.example) {
    return (
      <li className="card space-y-1 p-4" id={`post-${p.id}`}>
        <p className="flex items-center gap-2 font-bold">{p.displayName} <span className="chip">Example</span></p>
        <p>{p.body}</p>
      </li>
    );
  }
  return (
    <li className={`${isReply ? "ml-4 border-l-4 border-line pl-3" : "card p-4"} space-y-2`} id={`post-${p.id}`}>
      <p className="flex flex-wrap items-center gap-2"><span className="font-bold">{p.displayName}</span><span className="text-sm text-ink-soft">{when(p.createdAt)}</span>{p.held && <span className="chip">Under review</span>}</p>
      <p className="whitespace-pre-wrap break-words">{p.body}</p>
      <div className="flex flex-wrap items-center gap-1">
        {!p.isMine && !p.held && (
          <button type="button" aria-pressed={helpful.mine} disabled={pending} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-bold ${helpful.mine ? "bg-tint-mint" : "text-ink-soft"}`}
            onClick={() => start(async () => { const r = await setHelpfulAction({ postId: p.id, on: !helpful.mine }); if (r.ok) setHelpful({ count: r.count, mine: !helpful.mine }); else setMsg({ ok: false, text: r.error }); })}>
            <HandHeart size={18} aria-hidden="true" /> Helpful{helpful.count > 0 ? ` (${helpful.count})` : ""}
          </button>
        )}
        {p.isMine && helpful.count > 0 && <span className="px-3 text-sm font-bold text-ink-soft">{helpful.count} found this helpful</span>}
        {!isReply && !p.held && <button type="button" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-brand" onClick={() => setReplying((v) => !v)}>Reply</button>}
        {!p.isMine && <button type="button" aria-label="Report this post" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft" onClick={() => setReporting((v) => !v)}><Flag size={18} aria-hidden="true" /></button>}
        {p.isMine && <button type="button" aria-label="Delete my post" disabled={pending} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-coral-dark" onClick={() => start(async () => { const r = await deletePostAction(p.id); if (r.ok) onChanged(); else setMsg({ ok: false, text: r.error }); })}><Trash2 size={18} aria-hidden="true" /></button>}
      </div>
      {reporting && (
        <div role="group" aria-label="Report reason" className="flex flex-wrap gap-2">
          {REPORT_REASONS.map((reason) => (
            <button key={reason} type="button" disabled={pending} className="min-h-11 rounded-full border-2 border-field bg-white px-3 text-sm font-bold"
              onClick={() => start(async () => { const r = await reportPostAction({ postId: p.id, reason }); setReporting(false); setMsg(r.ok ? { ok: true, text: "Thank you. A moderator will look at it." } : { ok: false, text: r.error }); })}>{REASON_LABELS[reason]}</button>
          ))}
        </div>
      )}
      {replying && <Composer parentId={p.id} label="Write a kind reply" onDone={() => { setReplying(false); onChanged(); }} />}
      <p role="status" className={`min-h-5 text-sm font-bold ${msg.ok ? "" : "text-coral-dark"}`}>{msg.text}</p>
      {p.replies.length > 0 && <ul className="space-y-3">{p.replies.map((r) => <PostCard key={r.id} p={r} isReply onChanged={onChanged} />)}</ul>}
    </li>
  );
}

export function CommunityFeed({ initial, next }: { initial: FeedPost[]; next: string | null }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [cursor, setCursor] = useState(next);
  const [pending, start] = useTransition();
  const refresh = () => router.refresh();
  return (
    <div className="space-y-5">
      <section className="card space-y-2 p-5" aria-labelledby="guide-title">
        <h2 id="guide-title" className="font-display text-lg font-bold">Be kind</h2>
        <p className="text-ink-soft">Every child is different. Share what worked for you, never share phone numbers, addresses or where you live, and do not give medical advice. Posts are shown with your first name, or anonymously if you choose.</p>
      </section>
      <section aria-label="Write a post" className="card p-5"><Composer label="Share a question, a tip or a small win" onDone={refresh} /></section>
      <ul className="space-y-4">{posts.map((p) => <PostCard key={p.id} p={p} onChanged={refresh} />)}</ul>
      {cursor && <button type="button" className="btn-secondary w-full" disabled={pending} onClick={() => start(async () => { const r = await loadMoreAction(cursor); if (r.ok) { setPosts((old) => [...old, ...r.posts]); setCursor(r.next); } })}>Show older posts</button>}
    </div>
  );
}
