"use client";

// Last-resort page. It replaces the whole layout, so it cannot use the app's CSS: styles are inline.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FFF8F1", color: "#372F4A" }}>
        <main style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, padding: 20, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong on our side</h1>
          <p style={{ fontSize: 18, margin: 0, color: "#5A5270" }}>It's not you. Please try again.</p>
          <button type="button" onClick={reset} style={{ minHeight: 52, padding: "0 28px", borderRadius: 999, border: 0, background: "#5B49A8", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
