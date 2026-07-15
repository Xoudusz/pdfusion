import { useNavigate } from "react-router-dom";
import {
  GitMerge, Scissors, Minimize2, RotateCw,
  Images, FileImage, Lock, Server, type LucideIcon,
} from "lucide-react";

export type ToolId =
  | "merge" | "split" | "compress" | "rotate"
  | "images-to-pdf" | "pdf-to-images" | "password";

interface Tool {
  id: ToolId;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
  serverSide?: boolean;
}

const TOOLS: Tool[] = [
  { id: "merge",         path: "/merge",         label: "Merge PDF",    description: "Combine multiple PDFs into one",  icon: GitMerge  },
  { id: "split",         path: "/split",         label: "Split PDF",    description: "Extract pages or split by range", icon: Scissors  },
  { id: "compress",      path: "/compress",      label: "Compress PDF", description: "Reduce file size with Ghostscript", icon: Minimize2, serverSide: true },
  { id: "rotate",        path: "/rotate",        label: "Rotate PDF",   description: "Rotate pages 90°, 180°, 270°",   icon: RotateCw  },
  { id: "images-to-pdf", path: "/images-to-pdf", label: "Images to PDF", description: "Convert images to a PDF",        icon: Images    },
  { id: "pdf-to-images", path: "/pdf-to-images", label: "PDF to Images", description: "Export pages as PNG images",     icon: FileImage },
  { id: "password",      path: "/password",      label: "Protect PDF",  description: "Add a password to your PDF",     icon: Lock, disabled: true },
];

export default function ToolGrid() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 1.875rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "0.5rem" }}>
          Your PDF toolkit
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Most tools run entirely in your browser. Compress uses our server — your file is never stored.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => !tool.disabled && navigate(tool.path)}
              disabled={tool.disabled}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "1.5rem 1rem",
                cursor: tool.disabled ? "not-allowed" : "pointer",
                color: "var(--text)",
                opacity: tool.disabled ? 0.4 : 1,
                transition: "border-color 0.15s, background 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (tool.disabled) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--accent)";
                el.style.background = "#160909";
              }}
              onMouseLeave={(e) => {
                if (tool.disabled) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--border)";
                el.style.background = "var(--bg-card)";
              }}
            >
              {tool.serverSide && (
                <div
                  title="Server-side processing"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    color: "var(--text-muted)",
                    opacity: 0.5,
                  }}
                >
                  <Server size={11} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 12, background: "rgba(239,68,68,0.1)", color: "var(--accent)", marginBottom: "0.875rem", flexShrink: 0 }}>
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.375rem", lineHeight: 1.3 }}>{tool.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{tool.description}</div>
              {tool.disabled && (
                <div style={{ fontSize: "0.7rem", marginTop: "0.5rem", fontWeight: 600, color: "var(--accent)" }}>Coming soon</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
