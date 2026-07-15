interface Props {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  disabled?: boolean;
}

export default function DownloadButton({ onClick, loading, label, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: disabled || loading ? "#333" : "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius)",
        padding: "0.7rem 1.5rem",
        fontWeight: 600,
        fontSize: "0.9rem",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        minWidth: 140,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
      }}
    >
      {loading ? "Processing…" : (label ?? "Download")}
    </button>
  );
}
