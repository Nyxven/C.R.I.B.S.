"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Flag, HandHeart, HeartHandshake, MessageCircle, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import { Feedback } from "@/components/ui/Feedback";
import { createPostAction, deletePostAction, loadMoreAction, reportPostAction, setHelpfulAction } from "@/features/community/actions";
import { avatarLetter, avatarTone, POST_MAX, POST_STARTERS, REASON_LABELS, REPORT_REASONS } from "@/lib/community/rules";
import { timeAgo } from "@/lib/notifications/rules";
import type { FeedPost } from "@/server/community/service";

type Msg = { ok: boolean; text: string };
const when = (d: Date) => timeAgo(new Date(d), new Date());
const TONES = ["bg-tint-purple", "bg-tint-mint", "bg-tint-yellow", "bg-tint-pink", "bg-tint-sage", "bg-tint-coral"];

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-ink ${TONES[avatarTone(name)]} ${small ? "h-8 w-8 text-sm" : "h-11 w-11 text-lg"}`}>
      {avatarLetter(name)}
    </span>
  );
}

function Composer({ parentId, onDone, label }: { parentId?: string; onDone: () => void; label: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });
  const box = useRef<HTMLTextAreaElement>(null);
  const near = body.length > POST_MAX - 100;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createPostAction({ body, anonymous, parentId }); if (r.ok) { setBody(""); setMsg({ ok: true, text: parentId ? "Reply posted." : "Posted. Thank you for sharing." }); onDone(); } else setMsg({ ok: false, text: r.error }); }); }}>
      {!parentId && (
        <div role="group" aria-label="Ideas to start a post" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {POST_STARTERS.map((s) => (
            <button key={s} type="button" onClick={() => { setBody(s); box.current?.focus(); }}
              className="min-h-10 shrink-0 rounded-full border-2 border-tint-purple bg-white px-3 text-sm font-bold text-brand hover:border-brand">{s.replace(/[:\s]+$/, "")}…</button>
          ))}
        </div>
      )}
      <label className="block"><span className="sr-only">{label}</span>
        <textarea ref={box} className={`field w-full rounded-2xl py-3 ${parentId ? "min-h-20" : "min-h-28"}`} maxLength={POST_MAX} placeholder={label} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-ink-soft">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post as anonymous
        </label>
        <div className="flex items-center gap-3">
          {near && <span className="text-sm font-bold text-ink-soft" aria-live="polite">{body.length} / {POST_MAX}</span>}
          <button className="btn-primary min-h-11 px-5" disabled={pending || body.trim().length < 3}><Send size={18} aria-hidden="true" /> {parentId ? "Reply" : "Post"}</button>
        </div>
      </div>
      <Feedback kind={msg.ok ? "success" : "error"} message={msg.text} />
    </form>
  );
}

const action = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition hover:bg-cream";

function PostCard({ p, isReply, onChanged }: { p: FeedPost; isReply?: boolean; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const [helpful, setHelpful] = useState(p.helpful);
  const [replying, setReplying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });

  const head = (
    <div className="flex items-center gap-3">
      <Avatar name={p.displayName} small={isReply} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-bold leading-tight">{p.displayName}{p.example && <span className="chip">Example</span>}{p.held && <span className="chip">Under review</span>}</p>
        {!p.example && <p className="text-sm text-ink-soft">{when(p.createdAt)}</p>}
      </div>
    </div>
  );

  if (p.example) {
    return <li className="post-card space-y-3" id={`post-${p.id}`}>{head}<p className="text-lg leading-relaxed">{p.body}</p></li>;
  }
  return (
    <li className={isReply ? "space-y-2 rounded-2xl bg-cream/70 p-3" : "post-card space-y-3"} id={`post-${p.id}`}>
      {head}
      <p className={`whitespace-pre-wrap break-words leading-relaxed ${isReply ? "" : "text-lg"}`}>{p.body}</p>
      <div className={`flex flex-wrap items-center gap-1 ${isReply ? "" : "border-t border-line pt-2"}`}>
        {!p.isMine && !p.held && (
          <button type="button" aria-pressed={helpful.mine} disabled={pending} className={`${action} ${helpful.mine ? "bg-tint-mint text-ink" : "text-ink-soft"}`}
            onClick={() => start(async () => { const r = await setHelpfulAction({ postId: p.id, on: !helpful.mine }); if (r.ok) setHelpful({ count: r.count, mine: !helpful.mine }); else setMsg({ ok: false, text: r.error }); })}>
            <HandHeart size={18} aria-hidden="true" /> Helpful{helpful.count > 0 ? ` · ${helpful.count}` : ""}
          </button>
        )}
        {p.isMine && helpful.count > 0 && <span className="inline-flex items-center gap-1.5 px-3 text-sm font-bold text-ink-soft"><HandHeart size={18} aria-hidden="true" /> {helpful.count} found this helpful</span>}
        {!isReply && !p.held && (
          <button type="button" aria-expanded={replying} className={`${action} text-brand`} onClick={() => setReplying((v) => !v)}>
            <MessageCircle size={18} aria-hidden="true" /> Reply{p.replies.length > 0 ? ` · ${p.replies.length}` : ""}
          </button>
        )}
        <span className="flex-1" />
        {!p.isMine && <button type="button" aria-label="Report this post" aria-expanded={reporting} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-cream" onClick={() => setReporting((v) => !v)}><Flag size={18} aria-hidden="true" /></button>}
        {p.isMine && <button type="button" aria-label="Delete my post" disabled={pending} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-coral-dark hover:bg-tint-coral" onClick={() => start(async () => { const r = await deletePostAction(p.id); if (r.ok) onChanged(); else setMsg({ ok: false, text: r.error }); })}><Trash2 size={18} aria-hidden="true" /></button>}
      </div>
      {reporting && (
        <div role="group" aria-label="Report reason" className="flex flex-wrap gap-2 rounded-2xl bg-cream p-3">
          <p className="w-full text-sm font-bold text-ink-soft">What is wrong with this post?</p>
          {REPORT_REASONS.map((reason) => (
            <button key={reason} type="button" disabled={pending} className="min-h-11 rounded-full border-2 border-field bg-white px-3 text-sm font-bold"
              onClick={() => start(async () => { const r = await reportPostAction({ postId: p.id, reason }); setReporting(false); setMsg(r.ok ? { ok: true, text: "Thank you. A moderator will look at it." } : { ok: false, text: r.error }); })}>{REASON_LABELS[reason]}</button>
          ))}
        </div>
      )}
      {p.replies.length > 0 && <ul className="space-y-2">{p.replies.map((r) => <PostCard key={r.id} p={r} isReply onChanged={onChanged} />)}</ul>}
      {replying && <Composer parentId={p.id} label="Write a kind reply" onDone={() => { setReplying(false); onChanged(); }} />}
      <Feedback kind={msg.ok ? "success" : "error"} message={msg.text} />
    </li>
  );
}

export function CommunityFeed({ initial, next }: { initial: FeedPost[]; next: string | null }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initial);
  const [cursor, setCursor] = useState(next);
  const [pending, start] = useTransition();
  const [more, setMore] = useState("");
  const refresh = () => router.refresh();
  const onlyExamples = posts.length > 0 && posts.every((p) => p.example);
  return (
    <div className="space-y-5">
      <section aria-label="Write a post" className="composer-card">
        <p className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><MessageSquarePlus size={22} className="text-brand" aria-hidden="true" /> Share with other parents</p>
        <Composer label="A question, a tip or a small win…" onDone={refresh} />
      </section>

      <details className="group rounded-2xl bg-tint-purple/60 px-4 py-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-bold [&::-webkit-details-marker]:hidden">
          <HeartHandshake size={20} className="shrink-0 text-brand" aria-hidden="true" />
          <span className="flex-1">Be kind: community guidelines</span>
          <ChevronDown size={20} className="shrink-0 text-brand transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="pb-3 text-sm leading-relaxed">Every child is different. Share what worked for you, never share phone numbers, addresses or where you live, and do not give medical advice. Posts show your first name, or “Anonymous” if you choose.</p>
      </details>

      {onlyExamples && (
        <p className="flex items-start gap-2 font-bold text-ink-soft"><MessageSquarePlus size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />No one has posted yet. These examples show how it works. Be the first to share.</p>
      )}
      <ul className="stagger space-y-4">{posts.map((p) => <PostCard key={p.id} p={p} onChanged={refresh} />)}</ul>
      {cursor && <button type="button" className="btn-secondary w-full" disabled={pending} onClick={() => start(async () => { const r = await loadMoreAction(cursor); if (r.ok) { setPosts((old) => [...old, ...r.posts]); setCursor(r.next); setMore(""); } else setMore(r.error); })}>{pending ? "Loading…" : "Show older posts"}</button>}
      <Feedback kind="error" message={more} />
    </div>
  );
}
