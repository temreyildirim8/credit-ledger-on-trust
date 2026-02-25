import Link from "next/link";

/**
 * Root not-found page
 * Handles 404s for paths without a locale prefix (e.g., /something-random)
 * Shows a simple 404 page with a link to the home page
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(80px, 15vw, 200px)",
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(to bottom right, #3B82F6, #2563EB)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            404
          </h1>
          <p style={{
            fontSize: "1.25rem",
            color: "#a1a1aa",
            marginBottom: "2rem",
          }}>
            Page not found
          </p>
          <Link
            href="/en"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3B82F6",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              transition: "background-color 0.2s",
            }}
          >
            Go to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
