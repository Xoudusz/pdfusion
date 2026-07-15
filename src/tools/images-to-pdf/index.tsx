import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import ResultActions from "../../components/ResultActions";

export default function ImagesToPdfTool() {
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (incoming: File[]) => {
    setImages((prev) => [...prev, ...incoming]);
    setError(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const doc = await PDFDocument.create();

      for (const image of images) {
        const arrayBuffer = await image.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const isPng = image.name.toLowerCase().endsWith(".png");

        const embedded = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);

        const page = doc.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: embedded.width,
          height: embedded.height,
        });
      }

      const output = await doc.save();
      setResult(output);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create PDF from images.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Images to PDF</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Combine JPEG and PNG images into a single PDF document.
        </p>
      </div>

      <FileDropzone
        accept=".jpg,.jpeg,.png"
        multiple
        label="Add images"
        onFiles={handleFiles}
      />

      {images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            {images.length} image{images.length !== 1 ? "s" : ""} selected — each becomes one page:
          </div>
          {images.map((img, i) => (
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
                  {img.name}
                </span>
                <span style={{ color: "var(--text-muted)", flexShrink: 0, fontSize: "0.8rem" }}>
                  {img.name.toLowerCase().endsWith(".png") ? "PNG" : "JPEG"}
                </span>
              </span>
              <button
                onClick={() => removeImage(i)}
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

      {!result ? (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <DownloadButton onClick={handleConvert} loading={loading} label="Convert & Save" disabled={images.length === 0} />
          {images.length > 0 && (
            <button onClick={() => { setImages([]); setError(null); setResult(null); }} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, padding: "0.65rem 1rem", fontSize: "0.875rem", cursor: "pointer" }}>
              Clear all
            </button>
          )}
        </div>
      ) : (
        <ResultActions
          data={result}
          filename="images.pdf"
          nextTools={[{ path: "/compress", label: "Compress" }, { path: "/split", label: "Split" }]}
        />
      )}
    </div>
  );
}
