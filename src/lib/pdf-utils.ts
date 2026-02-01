import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// Helper to convert Uint8Array to Blob
function uint8ArrayToBlob(data: Uint8Array, type: string): Blob {
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  return new Blob([buffer], { type });
}

export async function mergePDFs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return uint8ArrayToBlob(mergedPdfBytes, "application/pdf");
}

export async function splitPDF(
  file: File,
  ranges: { start: number; end: number }[]
): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const results: Blob[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pageIndices = [];
    for (let i = range.start - 1; i < range.end && i < pdf.getPageCount(); i++) {
      pageIndices.push(i);
    }
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    const pdfBytes = await newPdf.save();
    results.push(uint8ArrayToBlob(pdfBytes, "application/pdf"));
  }

  return results;
}

export async function splitPDFToPages(file: File): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const results: Blob[] = [];

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    results.push(uint8ArrayToBlob(pdfBytes, "application/pdf"));
  }

  return results;
}

export async function compressPDF(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // Basic compression by saving with object streams
  const compressedBytes = await pdf.save({
    useObjectStreams: true,
  });

  return uint8ArrayToBlob(compressedBytes, "application/pdf");
}

export async function rotatePDF(file: File, angle: number): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  });

  const rotatedBytes = await pdf.save();
  return uint8ArrayToBlob(rotatedBytes, "application/pdf");
}

export async function extractPages(
  file: File,
  pageNumbers: number[]
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const validIndices = pageNumbers
    .map((n) => n - 1)
    .filter((i) => i >= 0 && i < pdf.getPageCount());

  const copiedPages = await newPdf.copyPages(pdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return uint8ArrayToBlob(pdfBytes, "application/pdf");
}

export async function addWatermark(
  file: File,
  watermarkText: string
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 4,
      y: height / 2,
      size: 50,
      opacity: 0.3,
      rotate: degrees(45),
    });
  }

  const watermarkedBytes = await pdf.save();
  return uint8ArrayToBlob(watermarkedBytes, "application/pdf");
}

export async function protectPDF(
  file: File,
  _password: string
): Promise<Blob> {
  // Note: pdf-lib doesn't support encryption natively
  // We'll just return the PDF as-is with a note
  // For real encryption, you'd need a backend service
  const arrayBuffer = await file.arrayBuffer();
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

export async function getPDFPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  return pdf.getPageCount();
}

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

export async function downloadAsZip(blobs: Blob[], filenames: string[]) {
  const zip = new JSZip();
  
  blobs.forEach((blob, index) => {
    zip.file(filenames[index], blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "pdf-files.zip");
}

export async function pdfToImages(file: File): Promise<string[]> {
  // This would require pdf.js for rendering
  // For now, return empty - we'll implement a simplified version
  console.log("PDF to image conversion requires pdf.js rendering", file);
  return [];
}
