import { useState, useEffect } from "react";
import { Server } from "lucide-react";
import FileDropzone from "../../components/FileDropzone";
import ResultActions from "../../components/ResultActions";
import { consumePendingFile } from "../../lib/fileStore";

type Preset = "small" | "balanced" | "quality";

const PRESETS: { id: Preset; label: string; description: string }[] = [
  { id: "small",    label: "Small",        description: "72 dpi · smallest file" },
  { id: "balanced", label: "Balanced",     description: "150 dpi · good quality" },
  { id: "quality",  label: "High Quality", description: "300 dpi · near original" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: Uint8Array; originalSize: number; compressedSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const f = consumePendingFile();
    if (f) setFile(f);
  }, []);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Uploading…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("preset", preset);

      setProgress("Compressing…");
      const resp = await fetch("/api/compress", { method: "POST", body: formData });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || `Server error ${resp.status}`);
      }

      const buf = await resp.arrayBuffer();
      const data = new Uint8Array(buf);
      setResult({ data, originalSize: file.size, compressedSize: data.byteLength });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Compression failed.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Compress PDF</h2>
          <span
            title="Processed on our server — not stored"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, padding: "0.1rem 0.4rem" }}
          >
            <Server size={10} /> Server-side
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Ghostscript resamples images while preserving text and vectors. File is deleted after processing.
        </p>
      </div>

      {!file ? (
        <FileDropzone accept=".pdf" label="Select a PDF file" onFiles={handleFiles} />
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.65rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
          <span>
            <strong>{file.name}</strong>
            <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>— {formatBytes(file.size)}</span>
          </span>
          <button
            onClick={() => { setFile(null); setResult(null); setError(null); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 0.25rem", fontSize: "1rem" }}
          >✕</button>
        </div>
      )}

      {file && !result && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                background: preset === p.id ? "var(--accent)" : "var(--bg-card)",
                border: `1px solid ${preset === p.id ? "var(--accent)" : "var(--border)"}`,
                color: preset === p.id ? "#fff" : "var(--text-muted)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.75rem",
                transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.1rem" }}>{p.label}</div>
              <div style={{ opacity: 0.8 }}>{p.description}</div>
            </button>
          ))}
        </div>
      )}

      {result && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Done</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {formatBytes(result.originalSize)} → {formatBytes(result.compressedSize)}
            {result.compressedSize < result.originalSize && (
              <span style={{ color: "#22c55e", marginLeft: "0.5rem" }}>
                −{Math.round((1 - result.compressedSize / result.originalSize) * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {progress && <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{progress}</div>}
      {error && <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}

      {file && !result && (
        <button
          onClick={handleCompress}
          disabled={loading}
          style={{
            background: loading ? "#1e1e1e" : "var(--accent)",
            color: loading ? "var(--text-muted)" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.65rem 1.4rem",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: loading ? "not-allowed" : "pointer",
            alignSelf: "flex-start",
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
        >
          {loading ? progress ?? "Processing…" : "Compress & Save"}
        </button>
      )}

      {result && (
        <ResultActions
          data={result.data}
          filename={file!.name.replace(/\.pdf$/i, "-compressed.pdf")}
          nextTools={[
            { path: "/split", label: "Split" },
            { path: "/merge", label: "Merge" },
          ]}
        />
      )}
    </div>
  );
}
