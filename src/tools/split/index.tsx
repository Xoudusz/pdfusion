import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { Plus, X } from "lucide-react";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";
import { compressPdfBytes } from "../../lib/pdf";

interface Range {
  id: number;
  from: string;
  to: string;
}

type OutputMode = "separate" | "single";

function parseRange(from: string, to: string, total: number): number[] | null {
  const f = parseInt(from, 10);
  const t = parseInt(to, 10);
  if (isNaN(f) || isNaN(t) || f < 1 || t > total || f > t) return null;
  const pages: number[] = [];
  for (let i = f; i <= t; i++) pages.push(i - 1);
  return pages;
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 6,
  padding: "0.4rem 0.6rem",
  fontSize: "0.9rem",
  width: 64,
  outline: "none",
  textAlign: "center",
};

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState<Range[]>([{ id: 1, from: "", to: "" }]);
  const [outputMode, setOutputMode] = useState<OutputMode>("separate");
  const [compress, setCompress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    setError(null);
    setReading(true);
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setFile(f);
      setPageCount(doc.getPageCount());
      setRanges([{ id: Date.now(), from: "", to: "" }]);
    } catch {
      setError("Could not read PDF.");
    } finally {
      setReading(false);
    }
  };

  const updateRange = (id: number, field: "from" | "to", val: string) => {
    setRanges((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));
    setError(null);
  };

  const addRange = () => {
    setRanges((prev) => [...prev, { id: Date.now(), from: "", to: "" }]);
  };

  const removeRange = (id: number) => {
    setRanges((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  };

  const handleProcess = async () => {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const parsed: number[][] = [];

      for (const r of ranges) {
        const pages = parseRange(r.from, r.to, pageCount);
        if (!pages) {
          setError(`Invalid range "${r.from}-${r.to}". Pages must be between 1 and ${pageCount}, from ≤ to.`);
          setLoading(false);
          return;
        }
        parsed.push(pages);
      }

      const buildPdf = async (pages: number[]): Promise<Uint8Array> => {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(srcDoc, pages);
        copied.forEach((p) => out.addPage(p));
        const raw = await out.save({ useObjectStreams: true });
        if (!compress) return raw;
        return compressPdfBytes(raw.buffer as ArrayBuffer, 0.7, (page, total) => {
          setProgress(`Compressing page ${page}/${total}…`);
        });
      };

      if (outputMode === "single" || parsed.length === 1) {
        setProgress(compress ? "Building PDF…" : null);
        const allPages = parsed.flat();
        const data = await buildPdf(allPages);
        setProgress(null);
        await saveFile(data, "split.pdf");
      } else {
        const zip = new JSZip();
        for (let i = 0; i < parsed.length; i++) {
          setProgress(`Processing range ${i + 1}/${parsed.length}…`);
          const data = await buildPdf(parsed[i]);
          zip.file(`split-${i + 1}.pdf`, data);
        }
        setProgress("Zipping…");
        const zipData = await zip.generateAsync({ type: "uint8array" });
        setProgress(null);
        await saveFile(zipData, "split.zip");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to split PDF.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const canProcess = file && pageCount !== null && ranges.every((r) => r.from && r.to);

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Split PDF</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Define one or more page ranges to extract.
        </p>
      </div>

      {reading && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.65rem 1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Reading PDF…
        </div>
      )}

      {!file && !reading ? (
        <FileDropzone accept=".pdf" label="Select a PDF file" onFiles={handleFiles} />
      ) : !reading && file && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.875rem",
          }}
        >
          <span>
            <strong>{file.name}</strong>
            <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
              — {pageCount} page{pageCount !== 1 ? "s" : ""}
            </span>
          </span>
          <button
            onClick={() => { setFile(null); setPageCount(null); setRanges([{ id: 1, from: "", to: "" }]); setError(null); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 0.25rem", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {file && pageCount !== null && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Page ranges
            </div>

            {ranges.map((r, idx) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0.65rem 0.875rem",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", minWidth: 56 }}>
                  Range {idx + 1}
                </span>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={r.from}
                  onChange={(e) => updateRange(r.id, "from", e.target.value)}
                  placeholder="From"
                  style={inputStyle}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>–</span>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={r.to}
                  onChange={(e) => updateRange(r.id, "to", e.target.value)}
                  placeholder="To"
                  style={inputStyle}
                />
                {r.from && r.to && parseRange(r.from, r.to, pageCount) && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {parseRange(r.from, r.to, pageCount)!.length}p
                  </span>
                )}
                <button
                  onClick={() => removeRange(r.id)}
                  disabled={ranges.length === 1}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: ranges.length === 1 ? "#333" : "var(--text-muted)",
                    cursor: ranges.length === 1 ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 2,
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}

            <button
              onClick={addRange}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "none",
                border: "1px dashed var(--border)",
                color: "var(--text-muted)",
                borderRadius: 8,
                padding: "0.55rem 0.875rem",
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
              <Plus size={14} /> Add range
            </button>
          </div>

          {ranges.length > 1 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["separate", "single"] as OutputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setOutputMode(m)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: outputMode === m ? "var(--accent)" : "var(--bg-card)",
                    border: `1px solid ${outputMode === m ? "var(--accent)" : "var(--border)"}`,
                    color: outputMode === m ? "#fff" : "var(--text-muted)",
                    borderRadius: 8,
                    fontWeight: outputMode === m ? 600 : 400,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "separate" ? "Separate PDFs (.zip)" : "One PDF"}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {file && pageCount !== null && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            color: "var(--text-muted)",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={compress}
            onChange={(e) => setCompress(e.target.checked)}
            style={{ accentColor: "var(--accent)", width: 15, height: 15, cursor: "pointer" }}
          />
          Compress output (lossy — re-renders pages as JPEG)
        </label>
      )}

      {progress && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{progress}</div>}
      {error && <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}

      {file && pageCount !== null && (
        <DownloadButton
          onClick={handleProcess}
          loading={loading}
          label={`Split & Save${ranges.length > 1 && outputMode === "separate" ? " (.zip)" : ""}`}
          disabled={!canProcess}
        />
      )}
    </div>
  );
}
