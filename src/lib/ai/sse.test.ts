import { describe, expect, it } from "vitest";
import { extractDelta, parseSse } from "./sse";

describe("parseSse", () => {
  it("reads complete events and keeps half an event for later", () => {
    const a = parseSse('data: {"a":1}\n\ndata: {"a":2}\n\ndata: {"a"');
    expect(a.data).toEqual(['{"a":1}', '{"a":2}']);
    const b = parseSse(a.rest + ':3}\n\n');
    expect(b.data).toEqual(['{"a":3}']);
    expect(b.rest).toBe("");
  });
  it("handles CRLF, comments, [DONE] and event names", () => {
    const r = parseSse(': keep-alive\r\n\r\nevent: message\r\ndata: hi\r\n\r\ndata: [DONE]\r\n\r\n');
    expect(r.data).toEqual(["hi", "[DONE]"]);
  });
  it("joins multi-line data and tolerates a missing space", () => {
    expect(parseSse("data:a\ndata: b\n\n").data).toEqual(["a\nb"]);
  });
  it("holds back a trailing carriage return", () => {
    const a = parseSse("data: x\r");
    expect(a.data).toEqual([]);
    expect(parseSse(a.rest + "\n\r\n").data).toEqual(["x"]);
  });
});

describe("extractDelta", () => {
  it("gets the text", () => expect(extractDelta({ choices: [{ delta: { content: "Hel" } }] })).toEqual({ text: "Hel" }));
  it("ignores empty text and reasoning", () => {
    expect(extractDelta({ choices: [{ delta: { content: "" } }] })).toEqual({});
    expect(extractDelta({ choices: [{ delta: { reasoning_content: "thinking" } }] })).toEqual({});
  });
  it("gets usage and errors", () => {
    expect(extractDelta({ choices: [], usage: { prompt_tokens: 100, completion_tokens: 20 } })).toEqual({ usage: { inputTokens: 100, outputTokens: 20 } });
    expect(extractDelta({ error: { message: "quota exceeded" } })).toEqual({ error: "quota exceeded" });
  });
  it("survives junk", () => {
    for (const j of [null, 5, "x", [], { choices: "no" }, { usage: null }]) expect(() => extractDelta(j)).not.toThrow();
  });
});
