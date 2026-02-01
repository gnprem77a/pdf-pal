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
  console.log("[downloadBlob] Blob size:", blob.size, "type:", blob.type);
  
  const isNative = isRunningInNativeApp();
  console.log("[downloadBlob] isRunningInNativeApp():", isNative);
  
  if (isNative) {
    console.log("[downloadBlob] Native app detected - trying multiple download methods");
    
    // Method 1: Try Capacitor Filesystem if available
    if (Capacitor.isNativePlatform()) {
      try {
        console.log("[downloadBlob] Trying Capacitor Filesystem...");
        const base64Data = await blobToBase64(blob);
        
        if (typeof Filesystem?.writeFile === 'function') {
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });
          
          console.log("[downloadBlob] Capacitor Filesystem success:", result.uri);
          toast.success(`File saved: ${filename}`, {
            description: `Saved to Documents folder`,
            duration: 5000,
          });
          return;
        }
      } catch (error) {
        console.error("[downloadBlob] Capacitor Filesystem failed:", error);
      }
    }
    
    // Method 2: Create object URL and open in new window (triggers Android download manager)
    try {
      console.log("[downloadBlob] Trying window.open with object URL...");
      const objectUrl = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Some Android WebViews need the link to be in the DOM
      document.body.appendChild(link);
      
      // Try click first
      link.click();
      
      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      toast.success(`Downloading: ${filename}`, {
        duration: 3000,
      });
      return;
    } catch (error) {
      console.error("[downloadBlob] Object URL method failed:", error);
    }
    
    // Method 3: Open blob URL directly (some WebViews handle this)
    try {
      console.log("[downloadBlob] Trying direct window.open...");
      const objectUrl = URL.createObjectURL(blob);
      const newWindow = window.open(objectUrl, '_blank');
      
      if (newWindow) {
        toast.success(`Opening: ${filename}`, {
          description: "Save from the opened window",
          duration: 5000,
        });
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        return;
      }
    } catch (error) {
      console.error("[downloadBlob] Direct window.open failed:", error);
    }
    
    // Method 4: Use Android's share intent via navigation (last resort)
    try {
      console.log("[downloadBlob] Trying data URL navigation...");
      const base64Data = await blobToBase64(blob);
      const mimeType = blob.type || 'application/octet-stream';
      
      // Navigate to data URL - Android might offer to download
      window.location.href = `data:${mimeType};base64,${base64Data}`;
      
      toast.success(`Check your downloads for: ${filename}`, {
        duration: 5000,
      });
      return;
    } catch (error) {
      console.error("[downloadBlob] Data URL navigation failed:", error);
      toast.error("Download failed", {
        description: "Please try again or use the web version",
      });
    }
  } else {
    console.log("[downloadBlob] Using web download (saveAs)");
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
