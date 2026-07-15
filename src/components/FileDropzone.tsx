import { useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { openFiles, isTauri } from "../lib/tauri";

interface Props {
  accept?: string;
  multiple?: boolean;
  label?: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileDropzone({ accept, multiple, label, onFiles, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [picking, setPicking] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      accept ? accept.split(",").some((a) => f.name.endsWith(a.trim().replace("*", ""))) : true
    );
    if (files.length) onFiles(files);
  };

  const handleClick = async () => {
    if (disabled || picking) return;
    setPicking(true);
    try {
      const files = await openFiles({ multiple, accept });
      if (files.length) onFiles(files);
    } finally {
      setPicking(false);
    }
  };

  const busy = picking || disabled;

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={isTauri ? undefined : handleDrop}
      style={{
        border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
        padding: "3rem 2rem",
        background: dragging ? "#150a0a" : "var(--bg-card)",
        borderRadius: 10,
        textAlign: "center",
        userSelect: "none",
        cursor: busy ? "default" : "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem", color: picking ? "var(--accent)" : dragging ? "var(--accent)" : "var(--text-muted)" }}>
        {picking
          ? <Loader2 size={28} strokeWidth={1.5} className="animate-spin" />
          : <CloudUpload size={28} strokeWidth={1.5} />
        }
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem", color: "var(--text)" }}>
        {picking ? "Reading file…" : (label ?? (multiple ? "Select files" : "Select file"))}
      </div>
      {!picking && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {isTauri ? "Click to browse" : "Click or drag & drop"}
          {accept && <span style={{ marginLeft: "0.25rem", opacity: 0.6 }}>{accept}</span>}
        </div>
      )}
    </div>
  );
}
