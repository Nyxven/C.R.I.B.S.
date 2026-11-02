import { faqs } from "@/content";

export default function Faq() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Frequently Asked Questions</h1>
      {faqs.map((f) => (
        <details key={f.q} className="card group p-4">
          <summary className="cursor-pointer list-none font-bold">{f.q}</summary>
          <p className="mt-2 text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
