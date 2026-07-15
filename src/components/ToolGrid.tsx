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
  { id: "merge",         label: "Merge PDF",     description: "Combine multiple PDFs into one",   icon: GitMerge  },
  { id: "split",         label: "Split PDF",      description: "Extract pages or split by range",  icon: Scissors  },
  { id: "compress",      label: "Compress PDF",   description: "Reduce file size (lossy)",         icon: Minimize2 },
  { id: "rotate",        label: "Rotate PDF",     description: "Rotate pages 90°, 180°, 270°",    icon: RotateCw  },
  { id: "images-to-pdf", label: "Images to PDF",  description: "Convert images to a PDF",          icon: Images    },
  { id: "pdf-to-images", label: "PDF to Images",  description: "Export pages as PNG images",       icon: FileImage },
  { id: "password",      label: "Protect PDF",    description: "Add a password to your PDF",       icon: Lock, disabled: true },
];

interface Props {
  onSelect: (id: ToolId) => void;
}

export default function ToolGrid({ onSelect }: Props) {
  return (
    <div>
      <div className="mb-8 md:mb-10">
        <h1
          className="text-2xl md:text-3xl font-bold mb-1.5 tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Your PDF toolkit
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          All processing happens in your browser — files never leave your device.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => !tool.disabled && onSelect(tool.id)}
              disabled={tool.disabled}
              className="flex flex-col items-center text-center rounded-xl transition-all duration-150"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                padding: "1.5rem 1rem",
                cursor: tool.disabled ? "not-allowed" : "pointer",
                color: "var(--text)",
                opacity: tool.disabled ? 0.4 : 1,
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
              <div
                className="flex items-center justify-center rounded-xl mb-3.5"
                style={{
                  width: 52,
                  height: 52,
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--accent)",
                }}
              >
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <div className="font-semibold text-sm mb-1 leading-tight">{tool.label}</div>
              <div className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                {tool.description}
              </div>
              {tool.disabled && (
                <div className="text-xs mt-2 font-medium" style={{ color: "var(--accent)" }}>
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
