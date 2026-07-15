import { useState } from "react";
import { CloudUpload } from "lucide-react";
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
      className="rounded-lg transition-all duration-150 text-center select-none cursor-pointer"
      style={{
        border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
        padding: "3rem 2rem",
        background: dragging ? "#150a0a" : "var(--bg-card)",
      }}
    >
      <div
        className="flex justify-center mb-3 transition-colors duration-150"
        style={{ color: dragging ? "var(--accent)" : "var(--text-muted)" }}
      >
        <CloudUpload size={28} strokeWidth={1.5} />
      </div>
      <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
        {label ?? (multiple ? "Select files" : "Select file")}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {isTauri ? "Click to browse" : "Click or drag & drop"}
        {accept && <span className="ml-1 opacity-60">{accept}</span>}
      </div>
    </div>
  );
}
