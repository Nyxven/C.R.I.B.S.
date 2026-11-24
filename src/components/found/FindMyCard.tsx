"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2, MapPinned, Trash2 } from "lucide-react";
import { removeFindMyAction, saveFindMyAction } from "@/features/push/actions";
import { parseFindMyUrl, type FindMyState } from "@/lib/domain/findmy";
import { useT } from "@/lib/i18n/client";

type Link = { url: string; state: FindMyState; until: string } | null;

/** The parent's Find My "Share Item Location" link: one big button that opens Apple's live map, plus how to make a new link. */
export function FindMyCard({ link, childName }: { link: Link; childName: string | null }) {
  const t = useT();
  const router = useRouter();
  const [current, setCurrent] = useState<Link>(link);
  const [editing, setEditing] = useState(!link || link.state === "expired");
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [busy, start] = useTransition();
  const live = current && current.state !== "expired";
  // After a save the page re-renders on the server with the new link and its end date; take that in.
  useEffect(() => { setCurrent(link); }, [link?.url, link?.until, link?.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseFindMyUrl(value)) { setMsg({ ok: false, text: t("findmy.bad") }); return; }
    start(async () => {
      const r = await saveFindMyAction(value);
      if (r.ok) { setValue(""); setEditing(false); setMsg({ ok: true, text: t("findmy.saved") }); router.refresh(); }
      else setMsg({ ok: false, text: r.error });
    });
  };
  const remove = () => {
    const before = current;
    setCurrent(null); setEditing(true); setMsg({ ok: true, text: t("findmy.removed") }); // shows at once
    void removeFindMyAction().then((r) => { if (!r.ok) { setCurrent(before); setEditing(false); setMsg({ ok: false, text: r.error }); } });
  };

  return (
    <section className="card space-y-4 border-2 border-tint-purple bg-tint-purple/40 p-5" aria-labelledby="findmy-h">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand"><MapPinned size={22} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 id="findmy-h" className="font-display text-lg font-bold">{t("findmy.title")}</h2>
          <p className="text-ink-soft">{t("findmy.intro")}</p>
        </div>
      </div>

      {live && (
        <div className="space-y-2">
          <a href={current.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full min-h-14 text-lg">
            <MapPinned size={22} aria-hidden="true" /> {childName ? t("findmy.see", { name: childName }) : t("findmy.seeNoName")} <ExternalLink size={18} aria-hidden="true" />
          </a>
          <p className={`text-sm font-bold ${current.state === "expiring" ? "text-coral-dark" : "text-ink-soft"}`}>
            {current.state === "expiring" ? t("findmy.expiring") : t("findmy.until", { date: current.until })}
          </p>
        </div>
      )}
      {current?.state === "expired" && <p className="text-sm font-bold text-coral-dark">{t("findmy.expired")}</p>}

      {editing ? (
        <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4">
          <p className="font-bold">{t("findmy.howTitle")}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>{t("findmy.step1")}</li><li>{t("findmy.step2")}</li><li>{t("findmy.step3")}</li>
          </ol>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">{t("findmy.label")}</span>
            <input type="url" inputMode="url" autoComplete="off" spellCheck={false} className="field w-full" placeholder="https://" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary min-h-12" disabled={busy || value.trim().length < 12}><Link2 size={18} aria-hidden="true" /> {t("findmy.save")}</button>
            {live && <button type="button" className="btn-ghost min-h-12" onClick={() => setEditing(false)}>{t("nav.close")}</button>}
          </div>
          <p className="text-xs text-ink-soft">{t("findmy.note")}</p>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary min-h-11" onClick={() => setEditing(true)}><Link2 size={18} aria-hidden="true" /> {t("findmy.replace")}</button>
          <button type="button" className="btn-ghost min-h-11 text-coral-dark" onClick={remove}><Trash2 size={18} aria-hidden="true" /> {t("findmy.remove")}</button>
        </div>
      )}
      <p role="status" className={`min-h-5 text-sm font-bold ${msg.ok ? "text-mint-dark" : "text-coral-dark"}`}>{msg.text}</p>
      <p className="text-sm text-ink-soft">{t("findmy.renameTip", { name: childName ?? "…" })}</p>
    </section>
  );
}
