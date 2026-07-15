import {
  GitMerge,
  Scissors,
  Minimize2,
  RotateCw,
  Images,
  FileImage,
  Lock,
  type LucideIcon,
} from "lucide-react";

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
  icon: LucideIcon;
  disabled?: boolean;
}

const TOOLS: Tool[] = [
  { id: "merge",         label: "Merge PDF",       description: "Combine multiple PDFs into one",     icon: GitMerge  },
  { id: "split",         label: "Split PDF",        description: "Extract pages or split by range",    icon: Scissors  },
  { id: "compress",      label: "Compress PDF",     description: "Reduce file size (lossy)",           icon: Minimize2 },
  { id: "rotate",        label: "Rotate PDF",       description: "Rotate pages 90°, 180°, 270°",      icon: RotateCw  },
  { id: "images-to-pdf", label: "Images → PDF",     description: "Convert images to a PDF",            icon: Images    },
  { id: "pdf-to-images", label: "PDF → Images",     description: "Export pages as PNG images",         icon: FileImage },
  { id: "password",      label: "Protect PDF",      description: "Add a password to your PDF",         icon: Lock, disabled: true },
];

interface Props {
  onSelect: (id: ToolId) => void;
}

export default function ToolGrid({ onSelect }: Props) {
  return (
    <div>
      <div className="mb-10">
        <h1
          className="text-3xl font-bold mb-2 tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Your PDF toolkit
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          All processing happens in your browser — files never leave your device.
        </p>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => !tool.disabled && onSelect(tool.id)}
              disabled={tool.disabled}
              className="group text-left rounded-lg transition-all duration-150 relative overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                padding: "1.25rem",
                cursor: tool.disabled ? "not-allowed" : "pointer",
                color: "var(--text)",
                opacity: tool.disabled ? 0.45 : 1,
              }}
              onMouseEnter={(e) => {
                if (tool.disabled) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--accent)";
                el.style.background = "#150a0a";
              }}
              onMouseLeave={(e) => {
                if (tool.disabled) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--border)";
                el.style.background = "var(--bg-card)";
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-150 group-hover:opacity-100 opacity-0"
                style={{ background: "var(--accent)" }}
              />
              <div className="mb-3" style={{ color: "var(--accent)" }}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="font-semibold text-sm mb-1">{tool.label}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {tool.description}
              </div>
              {tool.disabled && (
                <div
                  className="text-xs mt-2 font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  Coming soon
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
