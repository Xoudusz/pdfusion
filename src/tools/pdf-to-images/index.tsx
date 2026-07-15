import { useState } from "react";
import JSZip from "jszip";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";
import { loadPdf, renderPageToCanvas } from "../../lib/pdf";

type Resolution = "1x" | "2x" | "3x";

const RESOLUTION_OPTIONS: { label: string; value: Resolution; scale: number }[] = [
  { label: "1x — Standard", value: "1x", scale: 1.0 },
  { label: "2x — High DPI (default)", value: "2x", scale: 2.0 },
  { label: "3x — Ultra HD", value: "3x", scale: 3.0 },
];

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "var(--radius)",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  outline: "none",
};

function canvasToUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Failed to convert canvas to blob.")); return; }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
      },
      "image/png"
    );
  });
}

export default function PdfToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [resolution, setResolution] = useState<Resolution>("2x");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setError(null);
    setProgress(null);
    setPageCount(null);

    try {
      const buf = await f.arrayBuffer();
      const pdf = await loadPdf(buf);
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not read PDF. Make sure the file is valid.");
      setFile(null);
    }
  };

  const handleExport = async () => {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const scale = RESOLUTION_OPTIONS.find((r) => r.value === resolution)?.scale ?? 2.0;
      const buf = await file.arrayBuffer();
      const pdf = await loadPdf(buf);

      if (pageCount === 1) {
        setProgress("Rendering page 1 of 1…");
        const canvas = await renderPageToCanvas(pdf, 1, scale);
        const bytes = await canvasToUint8Array(canvas);
        await saveFile(bytes, "page-1.png");
      } else {
        const zip = new JSZip();

        for (let i = 1; i <= pageCount; i++) {
          setProgress(`Rendering page ${i} of ${pageCount}…`);
          const canvas = await renderPageToCanvas(pdf, i, scale);
          const bytes = await canvasToUint8Array(canvas);
          zip.file(`page-${i}.png`, bytes);
        }

        setProgress("Building zip…");
        const zipBytes = await zip.generateAsync({ type: "uint8array" });
        await saveFile(zipBytes, "pages.zip");
      }

      setProgress(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to export images.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>PDF to Images</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Export each PDF page as a PNG image. Single pages save directly; multiple pages are zipped.
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
                {pageCount > 1 && " → saved as pages.zip"}
              </span>
            )}
          </span>
          <button
            onClick={() => { setFile(null); setPageCount(null); setError(null); setProgress(null); }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Resolution</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as Resolution)}
            style={{ ...inputStyle, width: "100%" }}
          >
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {progress && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{progress}</div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>
      )}

      {file && pageCount !== null && (
        <DownloadButton
          onClick={handleExport}
          loading={loading}
          label={pageCount === 1 ? "Export Image" : "Export as ZIP"}
          disabled={false}
        />
      )}
    </div>
  );
}
