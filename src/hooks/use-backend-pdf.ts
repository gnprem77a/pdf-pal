import { useState, useCallback } from "react";
import { getApiUrl, API_CONFIG } from "@/lib/api-config";
import { toast } from "sonner";

export type ProcessingStatus = "idle" | "processing" | "success" | "error";

interface BackendResponse {
  downloadUrl?: string;
  error?: string;
}

interface UseBackendPdfOptions {
  onSuccess?: (downloadUrl: string) => void;
  onError?: (error: string) => void;
}

export function useBackendPdf(options: UseBackendPdfOptions = {}) {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Process files through the backend API
   * Returns the download URL on success
   */
  const processFiles = useCallback(
    async (
      endpoint: keyof typeof API_CONFIG.endpoints,
      files: File[],
      additionalParams?: Record<string, string>,
      outputFilename?: string
    ): Promise<string | null> => {
      setStatus("processing");
      setProgress(10);
      setError(null);

      try {
        const formData = new FormData();
        
        // Append files with indexed names
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
        formData.append("fileCount", files.length.toString());

        // Append additional parameters
        if (additionalParams) {
          Object.entries(additionalParams).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        setProgress(30);

        const response = await fetch(getApiUrl(endpoint), {
          method: "POST",
          body: formData,
        });

        setProgress(70);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }

        const result: BackendResponse = await response.json();
        
        if (!result.downloadUrl) {
          throw new Error("No download URL returned from server");
        }

        setProgress(90);

        // Trigger download by navigating to the URL
        triggerDownload(result.downloadUrl, outputFilename);

        setProgress(100);
        setStatus("success");
        options.onSuccess?.(result.downloadUrl);

        return result.downloadUrl;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Processing failed";
        setError(errorMessage);
        setStatus("error");
        options.onError?.(errorMessage);
        
        toast.error("Processing failed", {
          description: errorMessage.includes("Network") || errorMessage.includes("fetch")
            ? "Backend server is not running. Please start your Go backend."
            : errorMessage,
        });

        return null;
      }
    },
    [options]
  );

  return {
    status,
    progress,
    error,
    reset,
    processFiles,
    setProgress,
  };
}

/**
 * Trigger file download from a real HTTPS URL
 * This works on all platforms including Android WebView
 */
export function triggerDownload(url: string, filename?: string): void {
  // Method 1: Create anchor and click (works for most browsers)
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  
  if (filename) {
    link.download = filename;
  }
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Helper to get original filename without extension
 */
export function getBaseName(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}
