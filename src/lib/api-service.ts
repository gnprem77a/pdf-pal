// API service for calling your self-hosted Go backend
import { getApiUrl, API_CONFIG } from "./api-config";

interface ApiResponse<T = Blob> {
  success: boolean;
  data?: T;
  error?: string;
}

// Response type for operations that return a download URL
interface DownloadUrlResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

// Generic file upload and conversion
async function uploadAndConvert(
  endpoint: keyof typeof API_CONFIG.endpoints,
  file: File,
  additionalParams?: Record<string, string>
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || `HTTP ${response.status}` };
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error - is your backend running?" 
    };
  }
}

// Upload files and get a download URL (for Android WebView)
async function uploadForDownloadUrl(
  endpoint: keyof typeof API_CONFIG.endpoints,
  files: File[],
  additionalParams?: Record<string, string>
): Promise<DownloadUrlResponse> {
  try {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
    formData.append("fileCount", files.length.toString());
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { success: true, downloadUrl: result.downloadUrl };
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error - is your backend running?" 
    };
  }
}

// Excel to PDF conversion
export async function convertExcelToPdf(file: File): Promise<ApiResponse> {
  return uploadAndConvert("excelToPdf", file);
}

// PDF to Excel conversion
export async function convertPdfToExcel(file: File): Promise<ApiResponse> {
  return uploadAndConvert("pdfToExcel", file);
}

// PowerPoint to PDF conversion
export async function convertPowerpointToPdf(file: File): Promise<ApiResponse> {
  return uploadAndConvert("powerpointToPdf", file);
}

// PDF to PowerPoint conversion
export async function convertPdfToPowerpoint(file: File): Promise<ApiResponse> {
  return uploadAndConvert("pdfToPowerpoint", file);
}

// Protect PDF with password
export async function protectPdf(file: File, password: string): Promise<ApiResponse> {
  return uploadAndConvert("protectPdf", file, { password });
}

// Convert PDF to PDF/A
export async function convertPdfToPdfa(file: File): Promise<ApiResponse> {
  return uploadAndConvert("pdfToPdfa", file);
}

// ============ PDF Operations (for Android - returns download URL) ============

// Merge PDFs - returns download URL
export async function mergePdfBackend(files: File[]): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("mergePdf", files);
}

// Split PDF - returns download URL
export async function splitPdfBackend(
  file: File, 
  ranges: { start: number; end: number }[]
): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("splitPdf", [file], { 
    ranges: JSON.stringify(ranges) 
  });
}

// Split PDF to individual pages - returns download URL (zip)
export async function splitPdfToPagesBackend(file: File): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("splitPdf", [file], { 
    mode: "individual" 
  });
}

// Compress PDF - returns download URL
export async function compressPdfBackend(file: File): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("compressPdf", [file]);
}

// Rotate PDF - returns download URL
export async function rotatePdfBackend(file: File, angle: number): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("rotatePdf", [file], { 
    angle: angle.toString() 
  });
}

// Extract pages - returns download URL
export async function extractPagesBackend(
  file: File, 
  pageNumbers: number[]
): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("extractPages", [file], { 
    pages: JSON.stringify(pageNumbers) 
  });
}

// Add watermark - returns download URL
export async function watermarkPdfBackend(
  file: File, 
  watermarkText: string
): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("watermarkPdf", [file], { 
    text: watermarkText 
  });
}

// Delete pages - returns download URL
export async function deletePagesBackend(
  file: File, 
  pagesToDelete: number[]
): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("deletePages", [file], { 
    pages: JSON.stringify(pagesToDelete) 
  });
}

// Reorder pages - returns download URL
export async function reorderPagesBackend(
  file: File, 
  newOrder: number[]
): Promise<DownloadUrlResponse> {
  return uploadForDownloadUrl("reorderPages", [file], { 
    order: JSON.stringify(newOrder) 
  });
}

// Health check for your backend
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Trigger Android download from a real HTTPS URL
export function triggerAndroidDownload(url: string, filename: string): void {
  // Create a temporary anchor and click it
  // This triggers Android's DownloadManager for real URLs
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 100);
}
