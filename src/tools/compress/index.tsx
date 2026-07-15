import { useState, useEffect, useRef } from "react";
import { Server } from "lucide-react";
import FileDropzone from "../../components/FileDropzone";
import ResultActions from "../../components/ResultActions";
import { consumePendingFile } from "../../lib/fileStore";

interface Preset {
  dpi: number;
  label: string;
  desc: string;
}

const PRESETS: Preset[] = [
  { dpi: 72,  label: "Small",        desc: "Smallest file" },
  { dpi: 150, label: "Balanced",     desc: "Good quality" },
  { dpi: 300, label: "High Quality", desc: "Near original" },
];

function dpiLabel(dpi: number): string {
  if (dpi <= 72)  return "Screen quality · smallest file";
  if (dpi <= 100) return "Low quality · very small file";
  if (dpi <= 150) return "Standard quality · good balance";
  if (dpi <= 200) return "Good quality · moderate size";
  if (dpi <= 250) return "High quality · larger file";
  return "Near original · largest file";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    setElapsed(0);
    setProgress("Uploading…");
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dpi", String(dpi));

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
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      setLoading(false);
      setProgress(null);
    }
  };

  const activePreset = PRESETS.find((p) => p.dpi === dpi);

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
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Image resolution</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{dpi} DPI</span>
          </div>

          <input
            type="range"
            min={50}
            max={300}
            step={1}
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
          />

          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", minHeight: "1.1em" }}>
            {dpiLabel(dpi)}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            {PRESETS.map((p) => (
              <button
                key={p.dpi}
                onClick={() => setDpi(p.dpi)}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.25rem",
                  background: activePreset?.dpi === p.dpi ? "var(--accent)" : "var(--bg)",
                  border: `1px solid ${activePreset?.dpi === p.dpi ? "var(--accent)" : "var(--border)"}`,
                  color: activePreset?.dpi === p.dpi ? "#fff" : "var(--text-muted)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ opacity: 0.75, fontSize: "0.7rem" }}>{p.desc}</div>
              </button>
            ))}
          </div>
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

      {loading && progress && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem" }}>
          <style>{`@keyframes pdfusion-bar{0%{left:-40%}100%{left:110%}}`}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{progress}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{elapsed}s</span>
          </div>
          <div style={{ position: "relative", height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              position: "absolute",
              top: 0,
              width: "40%",
              height: "100%",
              background: "var(--accent)",
              borderRadius: 2,
              animation: "pdfusion-bar 1.4s ease-in-out infinite",
            }} />
          </div>
          {elapsed > 10 && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              Large files can take a minute — Ghostscript is running on the server
            </div>
          )}
        </div>
      )}
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
