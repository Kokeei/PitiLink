"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", background: "#fafaf9", color: "#1c1917" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <h1 style={{ color: "#ea580c", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>PitiLink</h1>
            <div style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>😕</p>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Une erreur inattendue est survenue.</p>
              <p style={{ fontSize: 14, color: "#78716c", marginBottom: 16 }}>
                Rechargez la page. Si le problème persiste, contactez la direction de votre garderie.
              </p>
              <button
                onClick={() => reset()}
                style={{ width: "100%", background: "#ea580c", color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
