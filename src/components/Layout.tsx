interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  title?: string;
}

export default function Layout({ children, onBack, title }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 1.5rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "0.25rem 0.5rem",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            ←
          </button>
        )}
        <span
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            background: "linear-gradient(135deg, #ef4444, #f87171)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title ?? "PDFusion"}
        </span>
      </header>
      <main style={{ flex: 1, padding: "2rem 1.5rem" }}>{children}</main>
    </div>
  );
}
