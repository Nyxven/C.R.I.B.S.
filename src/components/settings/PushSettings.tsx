"use client";
import { useEffect, useState, useTransition } from "react";
import { BellRing, BookOpen, ClipboardList, Send, Smartphone } from "lucide-react";
import { pushStatusAction, subscribePushAction, testPushAction, unsubscribePushAction } from "@/features/push/actions";
import { updateSettingsAction } from "@/features/account/actions";
import { useT } from "@/lib/i18n/client";

type Support = "checking" | "ok" | "ios-install" | "unsupported" | "blocked";
type Msg = { ok: boolean; text: string };

/** The VAPID public key (base64url) as the bytes the browser wants. */
function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function detect(): Support {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return ios && !standalone ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return "ok";
}

function Switch({ id, label, sub, icon: Icon, on, onChange, disabled }: { id: string; label: string; sub?: string; icon: typeof BellRing; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="list-row">
      <span className="row-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span id={`${id}-l`} className="row-title block">{label}</span>
        {sub && <span className="row-sub block">{sub}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-l`} disabled={disabled} onClick={() => onChange(!on)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 disabled:opacity-50 ${on ? "border-brand bg-brand" : "border-field bg-white"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full transition-all duration-200 ${on ? "left-[26px] bg-white" : "left-0.5 bg-field"}`} />
      </button>
    </div>
  );
}

export function PushSettings({ publicKey, remindRead, remindLog }: { publicKey: string | null; remindRead: boolean; remindLog: boolean }) {
  const t = useT();
  const [support, setSupport] = useState<Support>("checking");
  const [on, setOn] = useState(false);
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<Msg>({ ok: true, text: "" });
  const [prefs, setPrefs] = useState({ remindRead, remindLog });

  useEffect(() => {
    const s = detect();
    setSupport(s);
    if (s !== "ok" || !publicKey) return;
    // Is this device already turned on, for this account?
    void navigator.serviceWorker.getRegistration("/").then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      const r = await pushStatusAction(sub.endpoint);
      if (r.ok && r.subscribed) setOn(true);
      else if (r.ok) await subscribePushAction(sub.toJSON()).then((x) => { if (x.ok) setOn(true); }); // same device, re-link it to this account
    });
  }, [publicKey]);

  const turnOn = () => start(async () => {
    setMsg({ ok: true, text: "" });
    if (!publicKey) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setSupport(permission === "denied" ? "blocked" : "ok"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const r = await subscribePushAction(sub.toJSON());
      if (r.ok) { setOn(true); setMsg({ ok: true, text: t("push.isOn") }); } else setMsg({ ok: false, text: r.error });
    } catch {
      setMsg({ ok: false, text: t("push.failed") });
    }
  });

  const turnOff = () => {
    setOn(false); setMsg({ ok: true, text: t("push.isOff") }); // shows at once
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await unsubscribePushAction(sub.endpoint); await sub.unsubscribe().catch(() => undefined); }
    });
  };

  const test = () => start(async () => {
    const r = await testPushAction();
    setMsg(r.ok ? { ok: true, text: t("push.testSent") } : { ok: false, text: r.error });
  });

  const setPref = (key: "remindRead" | "remindLog", value: boolean) => {
    const before = prefs;
    setPrefs({ ...prefs, [key]: value });
    void updateSettingsAction({ [key]: value }).then((r) => { if (!r.ok) { setPrefs(before); setMsg({ ok: false, text: r.error }); } });
  };

  const note = !publicKey ? t("push.notSetUp") : support === "ios-install" ? t("push.ios") : support === "unsupported" ? t("push.unsupported") : support === "blocked" ? t("push.blocked") : null;
  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-5" aria-labelledby="push-h">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tint-purple text-brand"><Smartphone size={22} aria-hidden="true" /></span>
          <div>
            <h2 id="push-h" className="font-display text-lg font-bold">{t("push.title")}</h2>
            <p className="text-ink-soft">{t("push.intro")}</p>
          </div>
        </div>
        {note ? (
          <p className="rounded-2xl bg-cream p-4 text-sm font-bold">{note}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {on ? (
              <>
                <button type="button" className="btn-secondary min-h-12" onClick={test} disabled={busy}><Send size={18} aria-hidden="true" /> {t("push.test")}</button>
                <button type="button" className="btn-ghost min-h-12" onClick={turnOff} disabled={busy}>{t("push.off")}</button>
              </>
            ) : (
              <button type="button" className="btn-primary min-h-12" onClick={turnOn} disabled={busy || support === "checking"}><BellRing size={18} aria-hidden="true" /> {t("push.on")}</button>
            )}
          </div>
        )}
        <p role="status" className={`min-h-5 text-sm font-bold ${msg.ok ? "text-mint-dark" : "text-coral-dark"}`}>{msg.text}</p>
      </section>

      <section aria-labelledby="rem-h">
        <h2 id="rem-h" className="section-label">{t("push.remindersTitle")}</h2>
        <div className="list-group">
          <Switch id="rr" icon={BookOpen} label={t("push.remindRead")} on={prefs.remindRead} onChange={(v) => setPref("remindRead", v)} />
          <Switch id="rl" icon={ClipboardList} label={t("push.remindLog")} on={prefs.remindLog} onChange={(v) => setPref("remindLog", v)} />
        </div>
        <p className="mt-2 px-1 text-sm text-ink-soft">{t("push.remindNote")}</p>
      </section>
    </div>
  );
}
