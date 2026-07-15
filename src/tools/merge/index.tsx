import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";

export default function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const output = await merged.save();
      await saveFile(output, "merged.pdf");
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
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Combine multiple PDF files into a single document.
        </p>
      </div>

      <FileDropzone
        accept=".pdf"
        multiple
        label="Add PDF files"
        onFiles={handleFiles}
      />

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            {files.length} file{files.length !== 1 ? "s" : ""} selected — will be merged in this order:
          </div>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", minWidth: 20 }}>{i + 1}.</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </span>
              </span>
              <button
                onClick={() => removeFile(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0 0.25rem",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <DownloadButton
          onClick={handleMerge}
          loading={loading}
          label="Merge & Save"
          disabled={files.length < 2}
        />
        {files.length > 0 && (
          <button
            onClick={() => { setFiles([]); setError(null); }}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: "var(--radius)",
              padding: "0.7rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
