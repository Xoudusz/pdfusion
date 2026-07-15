import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";
import { saveFile } from "../../lib/tauri";

type RotateTarget = "all" | "specific";

const ROTATION_OPTIONS = [
  { label: "90° clockwise", value: 90 },
  { label: "180°", value: 180 },
  { label: "270° clockwise (90° counter-clockwise)", value: 270 },
];

function parsePageNumbers(input: string, total: number): number[] | null {
  const nums: number[] = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 1 || n > total) return null;
    if (!nums.includes(n - 1)) nums.push(n - 1); // 0-based, deduplicated
  }
  return nums.length > 0 ? nums : null;
}

export default function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [target, setTarget] = useState<RotateTarget>("all");
  const [pageInput, setPageInput] = useState("");
  const [rotation, setRotation] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setError(null);
    setPageInput("");
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

  const handleRotate = async () => {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();

      if (target === "all") {
        pages.forEach((page) => {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rotation) % 360));
        });
      } else {
        const indices = parsePageNumbers(pageInput, pageCount);
        if (!indices) {
          setError(`Invalid page numbers. Enter comma-separated values between 1 and ${pageCount}.`);
          setLoading(false);
          return;
        }
        indices.forEach((i) => {
          const page = pages[i];
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rotation) % 360));
        });
      }

      const output = await doc.save();
      await saveFile(output, "rotated.pdf");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to rotate PDF.");
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

  const canProcess = file !== null && pageCount !== null && (target === "all" || pageInput.trim().length > 0);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Rotate Pages</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Rotate all pages or specific pages in a PDF document.
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
            onClick={() => { setFile(null); setPageCount(null); setPageInput(""); setError(null); }}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Rotation angle</label>
            <select
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              style={inputStyle}
            >
              {ROTATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["all", "specific"] as RotateTarget[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTarget(t); setPageInput(""); setError(null); }}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  background: target === t ? "var(--accent)" : "var(--bg-card)",
                  border: `1px solid ${target === t ? "var(--accent)" : "var(--border)"}`,
                  color: target === t ? "#fff" : "var(--text-muted)",
                  borderRadius: "var(--radius)",
                  fontWeight: target === t ? 600 : 400,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.15s",
                }}
              >
                {t === "all" ? "All pages" : "Specific pages"}
              </button>
            ))}
          </div>

          {target === "specific" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Page numbers (e.g. "1,3,5") — pages 1 to {pageCount}
              </label>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => { setPageInput(e.target.value); setError(null); }}
                placeholder="1,3,5"
                style={inputStyle}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>
      )}

      {file && pageCount !== null && (
        <DownloadButton
          onClick={handleRotate}
          loading={loading}
          label="Rotate & Save"
          disabled={!canProcess}
        />
      )}
    </div>
  );
}
