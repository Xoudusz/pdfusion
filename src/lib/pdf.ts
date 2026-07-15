import * as pdfjsLib from "pdfjs-dist";

let workerInitialized = false;

export function initPdfWorker() {
  if (workerInitialized) return;
  // Use new URL() for Vite + Tauri WebView compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;
  workerInitialized = true;
}

export async function loadPdf(data: ArrayBuffer) {
  initPdfWorker();
  return pdfjsLib.getDocument({ data }).promise;
}

export async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}
