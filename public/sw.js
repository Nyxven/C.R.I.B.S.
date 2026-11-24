// CRIBS service worker: shows phone notifications and opens the right page when one is tapped.
// It does not cache pages or work offline, so it never shows stale content.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const safePath = (p) => (typeof p === "string" && /^\/[A-Za-z0-9/_#?=&.-]{0,200}$/.test(p) && !p.startsWith("//") ? p : "/home");

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : "" }; }
  const title = typeof data.title === "string" && data.title ? data.title : "CRIBS";
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/brand/icon-192.png",
    badge: "/brand/icon-192.png",
    tag: typeof data.tag === "string" ? data.tag : undefined,
    data: { link: safePath(data.link) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(safePath(event.notification.data && event.notification.data.link), self.location.origin).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of open) {
      if (new URL(c.url).origin === self.location.origin && "focus" in c) { await c.focus(); if ("navigate" in c) await c.navigate(url); return; }
    }
    await self.clients.openWindow(url);
  })());
});
