import { useState } from "react";
import Layout from "./components/Layout";
import ToolGrid, { type ToolId } from "./components/ToolGrid";
import Merge from "./tools/merge";
import Split from "./tools/split";
import Compress from "./tools/compress";
import Rotate from "./tools/rotate";
import ImagesToPdf from "./tools/images-to-pdf";
import PdfToImages from "./tools/pdf-to-images";
import Password from "./tools/password";

const TOOL_LABELS: Record<ToolId, string> = {
  merge: "Merge PDF",
  split: "Split PDF",
  compress: "Compress PDF",
  rotate: "Rotate PDF",
  "images-to-pdf": "Images → PDF",
  "pdf-to-images": "PDF → Images",
  password: "Protect PDF",
};

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const handleBack = () => setActiveTool(null);

  if (activeTool) {
    const label = TOOL_LABELS[activeTool];
    return (
      <Layout onBack={handleBack} title={label}>
        {activeTool === "merge" && <Merge />}
        {activeTool === "split" && <Split />}
        {activeTool === "compress" && <Compress />}
        {activeTool === "rotate" && <Rotate />}
        {activeTool === "images-to-pdf" && <ImagesToPdf />}
        {activeTool === "pdf-to-images" && <PdfToImages />}
        {activeTool === "password" && <Password />}
      </Layout>
    );
  }

  return (
    <Layout>
      <ToolGrid onSelect={setActiveTool} />
    </Layout>
  );
}
