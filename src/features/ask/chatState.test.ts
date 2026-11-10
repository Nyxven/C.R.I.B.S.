import { describe, expect, it } from "vitest";
import { chatReducer, historyFor, initialChat, visibleText, type ChatAction, type ChatState } from "./chatState";

const run = (actions: ChatAction[], from: ChatState = initialChat) => actions.reduce(chatReducer, from);
const send = (text: string, n = 1): ChatAction => ({ type: "send", userId: `u${n}`, assistantId: `a${n}`, text });

describe("chatReducer", () => {
  it("adds the question and an empty streaming answer", () => {
    const s = run([send("Hi")]);
    expect(s.busy).toBe(true);
    expect(s.messages.map((m) => [m.role, m.status])).toEqual([["user", "done"], ["assistant", "streaming"]]);
  });
  it("builds the answer from deltas and finishes with sources", () => {
    const src = { id: "a", title: "A", href: "/a" };
    const s = run([send("Hi"), { type: "start", kind: "answer" }, { type: "delta", d: "Hel" }, { type: "delta", d: "lo [[a]]" }, { type: "done", sources: [src] }]);
    const last = s.messages.at(-1)!;
    expect(last.text).toBe("Hello [[a]]");
    expect(visibleText(last)).toBe("Hello");
    expect(last.sources).toEqual([src]);
    expect(last.status).toBe("done");
    expect(s.busy).toBe(false);
  });
  it("marks an emergency reply", () => {
    const s = run([send("x"), { type: "start", kind: "emergency" }]);
    expect(s.messages.at(-1)!.kind).toBe("emergency");
  });
  it("turns a failure into an error message and frees the composer", () => {
    const s = run([send("Hi"), { type: "delta", d: "partial" }, { type: "fail", message: "Oops" }]);
    expect(s.messages.at(-1)).toMatchObject({ status: "error", text: "Oops" });
    expect(visibleText(s.messages.at(-1)!)).toBe("Oops");
    expect(s.busy).toBe(false);
  });
  it("ignores late text after the answer finished", () => {
    const s = run([send("Hi"), { type: "delta", d: "Done." }, { type: "done", sources: [] }, { type: "delta", d: " extra" }]);
    expect(s.messages.at(-1)!.text).toBe("Done.");
  });
  it("end: an empty stream is an error, a partly received one is kept", () => {
    expect(run([send("Hi"), { type: "end" }]).messages.at(-1)).toMatchObject({ status: "error", text: "Connection lost. Please try again." });
    expect(run([send("Hi"), { type: "delta", d: "Some" }, { type: "end" }]).messages.at(-1)).toMatchObject({ status: "done", text: "Some" });
    const finished = run([send("Hi"), { type: "delta", d: "Ok" }, { type: "done", sources: [] }, { type: "end" }]);
    expect(finished.messages.at(-1)!.status).toBe("done");
  });
  it("remembers the saved chat id and the saved answer id from the done event", () => {
    const s = run([send("Hi"), { type: "delta", d: "Hello" }, { type: "done", sources: [], threadId: "t1", messageId: "m1" }]);
    expect(s.threadId).toBe("t1");
    expect(s.messages.at(-1)!.serverId).toBe("m1");
    expect(run([{ type: "done", sources: [] }], s).threadId).toBe("t1"); // a later done without ids keeps the chat
  });
  it("sets a thumb on one message only", () => {
    const s = run([send("Hi"), { type: "delta", d: "Hello" }, { type: "done", sources: [], threadId: "t1", messageId: "m1" }, { type: "feedback", id: "a1", value: "up" }]);
    expect(s.messages.map((m) => m.feedback ?? null)).toEqual([null, "up"]);
  });
  it("loads a saved chat and keeps its id through a retry", () => {
    const loaded = run([{ type: "load", threadId: "t9", messages: [{ id: "x", role: "user", text: "old", status: "done", kind: "answer", sources: [] }] }]);
    expect(loaded.threadId).toBe("t9");
    expect(run([send("next", 5), { type: "fail", message: "Oops" }, { type: "drop_last_turn" }], loaded).threadId).toBe("t9");
  });
  it("drops the last turn for a retry, and resets", () => {
    const s = run([send("one"), { type: "delta", d: "A" }, { type: "done", sources: [] }, send("two", 2), { type: "fail", message: "Oops" }, { type: "drop_last_turn" }]);
    expect(s.messages.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(run([send("x"), { type: "reset" }])).toEqual(initialChat);
  });
});

describe("historyFor", () => {
  it("sends finished turns without markers, leaves out failed answers, and ends with the new question", () => {
    const s = run([send("one"), { type: "delta", d: "Try this [[a]]" }, { type: "done", sources: [] }, send("two", 2), { type: "fail", message: "Oops" }]);
    expect(historyFor(s, "three")).toEqual([
      { role: "user", content: "one" }, { role: "assistant", content: "Try this" }, { role: "user", content: "two" }, { role: "user", content: "three" },
    ]);
  });
  it("is just the question for a new chat", () => expect(historyFor(initialChat, "Hi")).toEqual([{ role: "user", content: "Hi" }]));
  it("is just the question for a saved chat, because the server keeps its own copy", () => {
    const s = run([{ type: "load", threadId: "t1", messages: [{ id: "x", role: "user", text: "old", status: "done", kind: "answer", sources: [] }] }]);
    expect(historyFor(s, "next")).toEqual([{ role: "user", content: "next" }]);
  });
});
