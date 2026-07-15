import { ChevronLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  title?: string;
}

export default function Layout({ children, onBack, title }: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        className="sticky top-0 z-10 backdrop-blur-sm"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(10,10,10,0.85)",
          height: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            height: "100%",
            padding: "0 1rem",
            maxWidth: "64rem",
            marginInline: "auto",
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #ef4444, #f87171)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title ?? "PDFusion"}
          </span>
        </div>
      </header>
      <main
        style={{
          flex: 1,
          padding: "2rem 1rem",
          maxWidth: "64rem",
          marginInline: "auto",
          width: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
