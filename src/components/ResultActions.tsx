import { useNavigate } from "react-router-dom";
import { Download, ArrowRight } from "lucide-react";
import { saveFile } from "../lib/tauri";
import { setPendingFile } from "../lib/fileStore";

interface NextTool {
  path: string;
  label: string;
}

interface Props {
  data: Uint8Array;
  filename: string;
  nextTools?: NextTool[];
}

export default function ResultActions({ data, filename, nextTools }: Props) {
  const navigate = useNavigate();

  const handleDownload = () => saveFile(data, filename);

  const handleContinue = (path: string) => {
    setPendingFile(new File([data], filename, { type: "application/pdf" }));
    navigate(path);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
      <button
        onClick={handleDownload}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "0.65rem 1.4rem",
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
      >
        <Download size={15} /> Download
      </button>

      {nextTools?.map((t) => (
        <button
          key={t.path}
          onClick={() => handleContinue(t.path)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "var(--accent)";
            el.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "var(--border)";
            el.style.color = "var(--text-muted)";
          }}
        >
          {t.label} <ArrowRight size={13} />
        </button>
      ))}
    </div>
  );
}
