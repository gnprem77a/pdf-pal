// API service for calling your self-hosted Go backend
import { getApiUrl } from "./api-config";

interface ApiResponse<T = Blob> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic file upload and conversion
async function uploadAndConvert(
  endpoint: keyof typeof import("./api-config").API_CONFIG.endpoints,
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

// Health check for your backend
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}
