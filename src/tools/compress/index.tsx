import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";
import { loadPdf, renderPageToCanvas } from "../../lib/pdf";

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "var(--radius)",
  padding: "0.5rem 0.75rem",
  fontSize: "0.9rem",
  outline: "none",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setError(null);
    setProgress(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await loadPdf(arrayBuffer);
      const totalPages = pdf.numPages;
      const doc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Processing page ${i} of ${totalPages}…`);

        const canvas = await renderPageToCanvas(pdf, i, 2.0);
        const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Strip the data URL prefix to get raw base64, then decode to bytes
        const base64 = jpegDataUrl.split(",")[1];
        const binaryStr = atob(base64);
        const jpegBytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          jpegBytes[j] = binaryStr.charCodeAt(j);
        }

        const embedded = await doc.embedJpg(jpegBytes);
        const page = doc.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: embedded.width,
          height: embedded.height,
        });
      }

      setProgress("Saving…");
      const output = await doc.save();
      await saveFile(output, "compressed.pdf");
      setProgress(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to compress PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Compress PDF</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Reduce PDF file size by re-rendering pages as compressed JPEG images.
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
            <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
              — {formatBytes(file.size)} original
            </span>
          </span>
          <button
            onClick={() => { setFile(null); setError(null); setProgress(null); }}
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

      {file && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Quality: {quality.toFixed(1)}
          </label>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.1}
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            style={{
              ...inputStyle,
              padding: "0.25rem 0",
              width: "100%",
              accentColor: "var(--accent)",
              cursor: "pointer",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>0.1 — Smallest file</span>
            <span>1.0 — Best quality</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Note: Output size varies by content. Text-heavy PDFs compress well; scanned documents may grow.
          </p>
        </div>
      )}

      {progress && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{progress}</div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>
      )}

      {file && (
        <DownloadButton
          onClick={handleCompress}
          loading={loading}
          label="Compress & Save"
          disabled={!file}
        />
      )}
    </div>
  );
}
