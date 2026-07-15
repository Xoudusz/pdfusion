import { useState } from "react";
import FileDropzone from "../../components/FileDropzone";
import DownloadButton from "../../components/DownloadButton";

export default function PasswordTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
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
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Password Protect PDF</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Add password protection to a PDF document.
        </p>
      </div>

      <div
        style={{
          borderLeft: "3px solid var(--accent)",
          background: "#1a0a0a",
          padding: "0.75rem 1rem",
          borderRadius: "0 var(--radius) var(--radius) 0",
          fontSize: "0.875rem",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ display: "block", marginBottom: "0.25rem" }}>Not available in V1</strong>
        Password protection requires PDF encryption, which is not supported by{" "}
        <code
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "0.1em 0.35em",
            fontSize: "0.85em",
          }}
        >
          pdf-lib v1
        </code>{" "}
        in the browser. This feature is planned for V2, which will use server-side processing (e.g. qpdf or LibreOffice) to apply encryption securely. The UI below is a preview of the planned interface.
      </div>

      <div style={{ opacity: 0.45, pointerEvents: "none", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <FileDropzone
          accept=".pdf"
          label="Select a PDF file"
          onFiles={handleFiles}
        />

        {file && (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
            }}
          >
            <strong>{file.name}</strong>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={inputStyle}
              disabled
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              style={inputStyle}
              disabled
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Permissions (V2)
            </div>
            {[
              "Allow high-resolution printing",
              "Prevent copying of text and images",
              "Prevent modification",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    flexShrink: 0,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        <DownloadButton
          onClick={() => {}}
          label="Protect & Save"
          disabled
        />
      </div>
    </div>
  );
}
