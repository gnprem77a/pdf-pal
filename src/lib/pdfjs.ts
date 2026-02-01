import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for Vite by bundling the worker locally.
// This avoids CDN/CORS issues and works reliably in production builds.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export { pdfjsLib };
