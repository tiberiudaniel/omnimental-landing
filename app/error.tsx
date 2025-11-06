"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>Ceva nu a mers bine.</h1>
          <p>Te rugăm să reîncerci.</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              border: "1px solid #222",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Încearcă din nou
          </button>
        </div>
      </body>
    </html>
  );
}
