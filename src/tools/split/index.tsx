import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";

type Mode = "extract" | "range";

function parsePageNumbers(input: string, total: number): number[] | null {
  const nums: number[] = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 1 || n > total) return null;
    nums.push(n - 1); // convert to 0-based
  }
  return nums.length > 0 ? nums : null;
}

function parseRanges(input: string, total: number): number[][] | null {
  const ranges: number[][] = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^(\d+)-(\d+)$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (isNaN(start) || isNaN(end) || start < 1 || end > total || start > end) return null;
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i - 1); // 0-based
    ranges.push(pages);
  }
  return ranges.length > 0 ? ranges : null;
}

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("extract");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setError(null);
    setInput("");
    try {
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
    } catch {
      setError("Could not read PDF. Make sure the file is a valid PDF.");
      setFile(null);
      setPageCount(null);
    }
  };

  const handleProcess = async () => {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);

      if (mode === "extract") {
        const pages = parsePageNumbers(input, pageCount);
        if (!pages) {
          setError(`Invalid page numbers. Enter comma-separated numbers between 1 and ${pageCount}.`);
          setLoading(false);
          return;
        }
        const out = await PDFDocument.create();
        const copied = await out.copyPages(srcDoc, pages);
        copied.forEach((p) => out.addPage(p));
        const data = await out.save();
        await saveFile(data, "extracted.pdf");
      } else {
        const ranges = parseRanges(input, pageCount);
        if (!ranges) {
          setError(`Invalid ranges. Use format like "1-3,4-6" with pages between 1 and ${pageCount}.`);
          setLoading(false);
          return;
        }
        if (ranges.length === 1) {
          const out = await PDFDocument.create();
          const copied = await out.copyPages(srcDoc, ranges[0]);
          copied.forEach((p) => out.addPage(p));
          const data = await out.save();
          await saveFile(data, "split-1.pdf");
        } else {
          const zip = new JSZip();
          for (let i = 0; i < ranges.length; i++) {
            const out = await PDFDocument.create();
            const copied = await out.copyPages(srcDoc, ranges[i]);
            copied.forEach((p) => out.addPage(p));
            const data = await out.save();
            zip.file(`split-${i + 1}.pdf`, data);
          }
          const zipData = await zip.generateAsync({ type: "uint8array" });
          await saveFile(zipData, "split.zip");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to split PDF.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "var(--radius)",
    padding: "0.5rem 0.75rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Split PDF</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Extract specific pages or split a PDF into multiple documents by page range.
        </p>
      </div>

      {!file ? (
        <FileDropzone accept=".pdf" label="Select a PDF file" onFiles={handleFiles} />
      ) : (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.875rem",
          }}
        >
          <span>
            <strong>{file.name}</strong>
            {pageCount !== null && (
              <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                — {pageCount} page{pageCount !== 1 ? "s" : ""}
              </span>
            )}
          </span>
          <button
            onClick={() => { setFile(null); setPageCount(null); setInput(""); setError(null); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0 0.25rem",
            }}
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}

      {file && pageCount !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["extract", "range"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setInput(""); setError(null); }}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  background: mode === m ? "var(--accent)" : "var(--bg-card)",
                  border: `1px solid ${mode === m ? "var(--accent)" : "var(--border)"}`,
                  color: mode === m ? "#fff" : "var(--text-muted)",
                  borderRadius: "var(--radius)",
                  fontWeight: mode === m ? 600 : 400,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.15s",
                }}
              >
                {m === "extract" ? "Extract pages" : "Split by range"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {mode === "extract"
                ? `Page numbers (e.g. "1,3,5") — pages 1 to ${pageCount}`
                : `Ranges (e.g. "1-3,4-6") — pages 1 to ${pageCount}`}
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder={mode === "extract" ? "1,3,5" : "1-3,4-6"}
              style={inputStyle}
            />
            {mode === "range" && input && !error && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {(() => {
                  const ranges = parseRanges(input, pageCount);
                  if (!ranges) return null;
                  return ranges.length > 1
                    ? `${ranges.length} files will be saved as split.zip`
                    : "1 file will be saved as split-1.pdf";
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>
      )}

      {file && pageCount !== null && (
        <DownloadButton
          onClick={handleProcess}
          loading={loading}
          label={mode === "extract" ? "Extract & Save" : "Split & Save"}
          disabled={!input.trim()}
        />
      )}
    </div>
  );
}
