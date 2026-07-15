import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const navigate = useNavigate();
  const isHome = !title;

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
          {!isHome && (
            <button
              onClick={() => navigate("/")}
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
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
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
              cursor: isHome ? "default" : "pointer",
            }}
            onClick={() => !isHome && navigate("/")}
          >
            {title ? `PDFusion · ${title}` : "PDFusion"}
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
