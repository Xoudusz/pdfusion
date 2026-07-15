export type ToolId =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "images-to-pdf"
  | "pdf-to-images"
  | "password";

interface Tool {
  id: ToolId;
  label: string;
  description: string;
  icon: string;
}

const TOOLS: Tool[] = [
  { id: "merge", label: "Merge PDF", description: "Combine multiple PDFs into one", icon: "⊕" },
  { id: "split", label: "Split PDF", description: "Extract pages or split by range", icon: "✂" },
  { id: "compress", label: "Compress PDF", description: "Reduce file size (lossy)", icon: "⬇" },
  { id: "rotate", label: "Rotate PDF", description: "Rotate pages 90°, 180°, 270°", icon: "↻" },
  { id: "images-to-pdf", label: "Images → PDF", description: "Convert images to a PDF", icon: "🖼" },
  { id: "pdf-to-images", label: "PDF → Images", description: "Export pages as PNG images", icon: "📄" },
  { id: "password", label: "Protect PDF", description: "Add a password to your PDF", icon: "🔒" },
];

interface Props {
  onSelect: (id: ToolId) => void;
}

export default function ToolGrid({ onSelect }: Props) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        All processing happens in your browser — files never leave your device.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
              textAlign: "left",
              cursor: "pointer",
              color: "var(--text)",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.background = "#1a0a0a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{tool.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{tool.label}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{tool.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
