// The "download my data" file. Pure: gathers what the app holds about the person into one readable JSON object.
// It never includes internal ids, password or token hashes, or other people's data.
export type ExportInput = {
  now: Date;
  account: { name: string; email: string; createdAt: Date };
  settings: { displayName: string | null; relationship: string | null; language: string; theme: string; textSize: number; sensoryMode: boolean; notifOn: boolean; chatHistoryEnabled: boolean } | null;
  child: Record<string, unknown> | null;
  contact: { name: string; phone: string; isPublic: boolean } | null;
  progress: { slug: string; saved: boolean; read: boolean }[];
  chats: { title: string; updatedAt: Date; messages: { role: string; content: string; feedback: string | null; createdAt: Date }[] }[];
  tag: { enabled: boolean; createdAt: Date; accessCount: number } | null;
  posts: { body: string; isReply: boolean; status: string; createdAt: Date }[];
};

const iso = (d: Date) => d.toISOString();

export function buildExport(i: ExportInput) {
  return {
    about: "Everything C.R.I.B.S. holds about you, as a readable file. Passwords and tag secrets are never included because we do not store them in readable form.",
    exportedAt: iso(i.now),
    account: { name: i.account.name, email: i.account.email, createdAt: iso(i.account.createdAt) },
    settings: i.settings,
    child: i.child,
    emergencyContact: i.contact,
    guides: { saved: i.progress.filter((p) => p.saved).map((p) => p.slug), read: i.progress.filter((p) => p.read).map((p) => p.slug) },
    askChats: i.chats.map((c) => ({ title: c.title, lastMessageAt: iso(c.updatedAt), messages: c.messages.map((m) => ({ role: m.role, text: m.content, feedback: m.feedback, at: iso(m.createdAt) })) })),
    communityPosts: i.posts.map((p) => ({ text: p.body, isReply: p.isReply, status: p.status, at: iso(p.createdAt) })),
    ifFoundTag: i.tag ? { enabled: i.tag.enabled, madeAt: iso(i.tag.createdAt), timesOpened: i.tag.accessCount } : null,
  };
}

/** A safe file name for the download. */
export const exportFileName = (now: Date) => `cribs-my-data-${now.toISOString().slice(0, 10)}.json`;
