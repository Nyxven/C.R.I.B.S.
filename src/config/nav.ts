// Mobile bottom bar: Find CRIBS (child safety) has its own slot; less frequent places live under "More".
export const navItems = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/find", label: "Find", icon: "shield" },
  { href: "/ask", label: "Ask", icon: "sparkles", center: true },
  { href: "/directory", label: "Specialists", icon: "stethoscope" },
] as const;

/** The "More" sheet on phones, and the second group in the desktop sidebar. */
export const moreItems = [
  { href: "/logs", key: "nav.logs", icon: "clipboard" },
  { href: "/faq", key: "nav.faq", icon: "help" },
  { href: "/community", key: "home.community", icon: "users" },
  { href: "/saved", key: "home.saved", icon: "bookmark" },
  { href: "/child", key: "home.child", icon: "smile" },
  { href: "/notifications", key: "nav.notifications", icon: "bell" },
  { href: "/settings", key: "nav.settings", icon: "settings" },
] as const;
