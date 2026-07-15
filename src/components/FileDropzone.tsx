import { useState } from "react";
import { openFiles, isTauri } from "../lib/tauri";

interface Props {
  accept?: string;
  multiple?: boolean;
  label?: string;
  onFiles: (files: File[]) => void;
}

export default function FileDropzone({ accept, multiple, label, onFiles }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      accept ? accept.split(",").some((a) => f.name.endsWith(a.trim().replace("*", ""))) : true
    );
    if (files.length) onFiles(files);
  };

  const handleClick = async () => {
    const files = await openFiles({ multiple, accept });
    if (files.length) onFiles(files);
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={isTauri ? undefined : handleDrop}
      style={{
        border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "3rem 2rem",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#1a0a0a" : "var(--bg-card)",
        transition: "border-color 0.15s, background 0.15s",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📂</div>
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
        {label ?? (multiple ? "Select files" : "Select file")}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        {isTauri ? "Click to browse" : "Click or drag & drop"}
        {accept && ` · ${accept}`}
      </div>
    </div>
  );
}
