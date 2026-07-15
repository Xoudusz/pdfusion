import { Download, Loader2 } from "lucide-react";

interface Props {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  disabled?: boolean;
}

export default function DownloadButton({ onClick, loading, label, disabled }: Props) {
  const inactive = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={inactive}
      className="inline-flex items-center gap-2 rounded-md font-semibold text-sm transition-colors duration-150"
      style={{
        background: inactive ? "#1e1e1e" : "var(--accent)",
        color: inactive ? "var(--text-muted)" : "#fff",
        border: "none",
        padding: "0.65rem 1.4rem",
        cursor: inactive ? "not-allowed" : "pointer",
        minWidth: 140,
      }}
      onMouseEnter={(e) => {
        if (!inactive)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        if (!inactive)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
      }}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Download size={15} />
      )}
      {loading ? "Processing…" : (label ?? "Download")}
    </button>
  );
}
