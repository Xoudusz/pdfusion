import * as pdfjsLib from "pdfjs-dist";

let workerInitialized = false;

export function initPdfWorker() {
  if (workerInitialized) return;
  // Static asset in /public — avoids dynamic import issues in nginx/Tauri
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerInitialized = true;
}

export async function loadPdf(data: ArrayBuffer) {
  initPdfWorker();
  return pdfjsLib.getDocument({ data }).promise;
}

export async function compressPdfBytes(
  bytes: ArrayBuffer,
  quality = 0.7,
  onProgress?: (page: number, total: number) => void
): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const total = pdf.numPages;
  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const canvas = await renderPageToCanvas(pdf, i, 2.0);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];
    const bin = atob(base64);
    const jpegBytes = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) jpegBytes[j] = bin.charCodeAt(j);
    const img = await out.embedJpg(jpegBytes);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return out.save();
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
