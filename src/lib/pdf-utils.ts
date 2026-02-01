import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { toast } from "sonner";

// Detect if running in a native Android/iOS WebView
// This works even when loading from a remote URL
function isRunningInNativeApp(): boolean {
  // Check Capacitor's detection first
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // Fallback: Check user agent for Android WebView or iOS WebView
  const ua = navigator.userAgent.toLowerCase();
  const isAndroidWebView = ua.includes('wv') || (ua.includes('android') && ua.includes('version/'));
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(navigator.userAgent);
  
  // Also check for Capacitor's custom platform setting
  const windowWithCapacitor = window as typeof window & { CapacitorCustomPlatform?: string };
  if (windowWithCapacitor.CapacitorCustomPlatform) {
    return true;
  }
  
  console.log("[isRunningInNativeApp] UA check - Android WebView:", isAndroidWebView, "iOS WebView:", isIOSWebView);
  
  return isAndroidWebView || isIOSWebView;
}

// Helper to convert Uint8Array to Blob
function uint8ArrayToBlob(data: Uint8Array, type: string): Blob {
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  return new Blob([buffer], { type });
}

// Helper to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

export async function downloadBlob(blob: Blob, filename: string) {
  console.log("[downloadBlob] Starting download for:", filename);
  console.log("[downloadBlob] Capacitor.isNativePlatform():", Capacitor.isNativePlatform());
  console.log("[downloadBlob] Capacitor.getPlatform():", Capacitor.getPlatform());
  console.log("[downloadBlob] isRunningInNativeApp():", isRunningInNativeApp());
  console.log("[downloadBlob] User Agent:", navigator.userAgent);
  console.log("[downloadBlob] Blob size:", blob.size);
  
  const isNative = isRunningInNativeApp();
  
  // Check if running on native platform (Android/iOS)
  if (isNative) {
    console.log("[downloadBlob] Detected native app environment");
    
    // Try using Capacitor Filesystem if available
    try {
      console.log("[downloadBlob] Converting blob to base64...");
      const base64Data = await blobToBase64(blob);
      console.log("[downloadBlob] Base64 conversion complete, length:", base64Data.length);
      
      // Check if Filesystem plugin is available
      if (typeof Filesystem?.writeFile === 'function') {
        console.log("[downloadBlob] Filesystem plugin available, writing file...");
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        
        console.log("[downloadBlob] File saved successfully to:", result.uri);
        toast.success(`File saved: ${filename}`, {
          description: `Saved to: ${result.uri}`,
          duration: 5000,
        });
        return;
      } else {
        console.log("[downloadBlob] Filesystem plugin not available, falling back to data URL download");
      }
    } catch (error) {
      console.error("[downloadBlob] Filesystem write failed:", error);
      // Fall through to alternative download method
    }
    
    // Fallback: Create a download link with data URL
    try {
      console.log("[downloadBlob] Attempting data URL download fallback...");
      const base64Data = await blobToBase64(blob);
      const mimeType = blob.type || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`File downloaded: ${filename}`, {
        duration: 5000,
      });
      return;
    } catch (fallbackError) {
      console.error("[downloadBlob] Data URL fallback failed:", fallbackError);
      toast.error("Failed to save file", {
        description: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
      });
      throw fallbackError;
    }
  } else {
    console.log("[downloadBlob] Using web download (saveAs)");
    // Use standard web download for browsers
    saveAs(blob, filename);
  }
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
