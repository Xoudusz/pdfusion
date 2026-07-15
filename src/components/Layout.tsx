import { ChevronLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  title?: string;
}

export default function Layout({ children, onBack, title }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "rgba(10,10,10,0.85)",
          height: 56,
        }}
      >
        <div
          className="flex items-center gap-2 h-full px-6 max-w-5xl mx-auto"
        >
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                color: "var(--text-muted)",
                padding: "0.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
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
            className="font-bold text-sm tracking-tight"
            style={{
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
      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
