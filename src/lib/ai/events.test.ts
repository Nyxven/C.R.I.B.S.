import { describe, expect, it } from "vitest";
import { encodeEvent, parseEvents, type ChatEvent } from "./events";

describe("chat events", () => {
  it("round-trips every event type", () => {
    const list: ChatEvent[] = [
      { t: "start", kind: "answer" }, { t: "text", d: "Hello\nthere" }, { t: "done", sources: [{ id: "a", title: "A", href: "/a" }] }, { t: "error", message: "Oops" },
    ];
    const { events, rest } = parseEvents(list.map(encodeEvent).join(""));
    expect(events).toEqual(list);
    expect(rest).toBe("");
  });
  it("keeps half a line for the next chunk", () => {
    const line = encodeEvent({ t: "text", d: "abc" });
    const first = parseEvents(line + line.slice(0, 5));
    expect(first.events).toHaveLength(1);
    const second = parseEvents(first.rest + line.slice(5));
    expect(second.events).toEqual([{ t: "text", d: "abc" }]);
  });
  it("skips broken and unknown lines", () => {
    const r = parseEvents('not json\n{"t":"nope"}\n{"t":"text","d":5}\n{"t":"text","d":"ok"}\n');
    expect(r.events).toEqual([{ t: "text", d: "ok" }]);
  });
  it("drops sources with the wrong shape", () => {
    const r = parseEvents('{"t":"done","sources":[{"id":"a","title":"A","href":"/a"},{"id":1},"x"]}\n');
    expect(r.events).toEqual([{ t: "done", sources: [{ id: "a", title: "A", href: "/a" }] }]);
  });
});
