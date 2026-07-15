import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ToolGrid from "./components/ToolGrid";
import Merge from "./tools/merge";
import Split from "./tools/split";
import Compress from "./tools/compress";
import Rotate from "./tools/rotate";
import ImagesToPdf from "./tools/images-to-pdf";
import PdfToImages from "./tools/pdf-to-images";
import Password from "./tools/password";

const TOOL_LABELS: Record<string, string> = {
  merge: "Merge PDF",
  split: "Split PDF",
  compress: "Compress PDF",
  rotate: "Rotate PDF",
  "images-to-pdf": "Images → PDF",
  "pdf-to-images": "PDF → Images",
  password: "Protect PDF",
};

function ToolPage({ id, children }: { id: string; children: React.ReactNode }) {
  return <Layout title={TOOL_LABELS[id]}>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><ToolGrid /></Layout>} />
      <Route path="/merge" element={<ToolPage id="merge"><Merge /></ToolPage>} />
      <Route path="/split" element={<ToolPage id="split"><Split /></ToolPage>} />
      <Route path="/compress" element={<ToolPage id="compress"><Compress /></ToolPage>} />
      <Route path="/rotate" element={<ToolPage id="rotate"><Rotate /></ToolPage>} />
      <Route path="/images-to-pdf" element={<ToolPage id="images-to-pdf"><ImagesToPdf /></ToolPage>} />
      <Route path="/pdf-to-images" element={<ToolPage id="pdf-to-images"><PdfToImages /></ToolPage>} />
      <Route path="/password" element={<ToolPage id="password"><Password /></ToolPage>} />
      <Route path="*" element={<Layout><ToolGrid /></Layout>} />
    </Routes>
  );
}
