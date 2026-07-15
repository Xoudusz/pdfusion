import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { GripVertical, X, FileText, ChevronUp, ChevronDown } from "lucide-react";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import ResultActions from "../../components/ResultActions";
import { loadPdf, renderPageToCanvas } from "../../lib/pdf";
import { consumePendingFile } from "../../lib/fileStore";

interface FileItem {
  id: number;
  file: File;
  pageCount: number;
  thumb: string | null;
}

async function generateThumb(file: File): Promise<{ pageCount: number; thumb: string | null }> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await loadPdf(bytes.slice(0) as ArrayBuffer);
    const canvas = await renderPageToCanvas(pdf, 1, 0.4);
    return { pageCount: pdf.numPages, thumb: canvas.toDataURL("image/jpeg", 0.7) };
  } catch {
    return { pageCount: 0, thumb: null };
  }
}

export default function MergeTool() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [reading, setReading] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const f = consumePendingFile();
    if (f) handleFiles([f]);
  }, []);

  const handleFiles = async (files: File[]) => {
    setError(null);
    setReading((n) => n + files.length);
    const newItems: FileItem[] = [];
    for (const file of files) {
      const id = nextId.current++;
      const { pageCount, thumb } = await generateThumb(file);
      newItems.push({ id, file, pageCount, thumb });
      setReading((n) => n - 1);
    }
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const onDragStart = (idx: number) => { dragIndex.current = idx; };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(idx, 0, moved);
      dragIndex.current = idx;
      return next;
    });
  };

  const onDragEnd = () => { dragIndex.current = null; };

  const handleMerge = async () => {
    if (items.length < 2) { setError("Need at least 2 PDF files to merge."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const merged = await PDFDocument.create();
      for (const item of items) {
        const bytes = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const output = await merged.save();
      setResult(output);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to merge PDFs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Merge PDFs</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Add files, drag to reorder, then merge.
        </p>
      </div>

      <FileDropzone accept=".pdf" multiple label="Add PDF files" onFiles={handleFiles} />

      {(items.length > 0 || reading > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>
            {items.length} file{items.length !== 1 ? "s" : ""}{reading > 0 ? ` — reading ${reading} more…` : " — drag to reorder"}
          </div>

          {Array.from({ length: reading }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.5rem 0.75rem",
                opacity: 0.5,
              }}
            >
              <div style={{ width: 32, height: 42, borderRadius: 3, background: "var(--border)", flexShrink: 0 }} />
              <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Reading PDF…</div>
            </div>
          ))}

          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.5rem 0.75rem",
                userSelect: "none",
              }}
            >
              <GripVertical size={16} style={{ color: "var(--border)", flexShrink: 0, cursor: "grab" }} />

              {item.thumb ? (
                <img
                  src={item.thumb}
                  alt=""
                  style={{
                    width: 32,
                    height: 42,
                    objectFit: "cover",
                    borderRadius: 3,
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    border: "1px solid var(--border)",
                    background: "#0f0f0f",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.file.name}
                </div>
                {item.pageCount > 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {item.pageCount} page{item.pageCount !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#2a2a2a" : "var(--text-muted)", padding: 1, display: "flex" }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === items.length - 1}
                  style={{ background: "none", border: "none", cursor: idx === items.length - 1 ? "default" : "pointer", color: idx === items.length - 1 ? "#2a2a2a" : "var(--text-muted)", padding: 1, display: "flex" }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}

      {!result ? (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <DownloadButton onClick={handleMerge} loading={loading} label="Merge & Save" disabled={items.length < 2} />
          {items.length > 0 && (
            <button
              onClick={() => { setItems([]); setError(null); setResult(null); }}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "0.65rem 1rem", fontSize: "0.875rem", cursor: "pointer" }}
            >
              Clear all
            </button>
          )}
        </div>
      ) : (
        <ResultActions
          data={result}
          filename="merged.pdf"
          nextTools={[{ path: "/compress", label: "Compress" }, { path: "/split", label: "Split" }]}
        />
      )}
    </div>
  );
}
