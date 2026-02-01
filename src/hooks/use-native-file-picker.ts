import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { FilePicker, PickFilesResult } from "@capawesome/capacitor-file-picker";

interface UseNativeFilePickerOptions {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export const useNativeFilePicker = () => {
  const isNative = Capacitor.isNativePlatform();

  const pickFiles = useCallback(
    async (options: UseNativeFilePickerOptions = {}): Promise<File[]> => {
      const { accept = "*/*", multiple = false, maxFiles = 10 } = options;

      // Convert accept string to types array for Capacitor
      // e.g., ".pdf" -> ["application/pdf"], ".pdf,.doc" -> ["application/pdf", "application/msword"]
      const mimeTypes = acceptToMimeTypes(accept);

      if (isNative) {
        try {
          const result: PickFilesResult = await FilePicker.pickFiles({
            types: mimeTypes,
            limit: multiple ? 0 : 1, // 0 = unlimited, 1 = single file
            readData: true, // Get base64 data
          });
          // Convert picked files to File objects
          const files: File[] = await Promise.all(
            result.files.slice(0, maxFiles).map(async (pickedFile) => {
              // If we have base64 data, convert to File
              if (pickedFile.data) {
                const byteString = atob(pickedFile.data);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: pickedFile.mimeType });
                return new File([blob], pickedFile.name, { type: pickedFile.mimeType });
              }
              
              // Fallback: try to fetch from path (for some platforms)
              if (pickedFile.path) {
                const response = await fetch(pickedFile.path);
                const blob = await response.blob();
                return new File([blob], pickedFile.name, { type: pickedFile.mimeType });
              }

              throw new Error("Could not read file data");
            })
          );

          return files;
        } catch (error) {
          console.error("Native file picker error:", error);
          // Fall back to web picker if native fails
          return pickFilesWeb(accept, multiple, maxFiles);
        }
      }

      // Use web file picker for non-native platforms
      return pickFilesWeb(accept, multiple, maxFiles);
    },
    [isNative]
  );

  return { pickFiles, isNative };
};

// Web fallback using input element
function pickFilesWeb(accept: string, multiple: boolean, maxFiles: number): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    
    input.onchange = () => {
      const files = input.files ? Array.from(input.files).slice(0, maxFiles) : [];
      resolve(files);
    };
    
    input.oncancel = () => resolve([]);
    input.click();
  });
}

// Convert accept string to MIME types
function acceptToMimeTypes(accept: string): string[] {
  const mappings: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".html": "text/html",
    ".txt": "text/plain",
    "image/*": "image/*",
    "application/pdf": "application/pdf",
  };

  const types = accept.split(",").map((ext) => ext.trim());
  const mimeTypes: string[] = [];

  for (const type of types) {
    if (mappings[type]) {
      mimeTypes.push(mappings[type]);
    } else if (type.includes("/")) {
      // Already a MIME type
      mimeTypes.push(type);
    }
  }

  return mimeTypes.length > 0 ? mimeTypes : ["*/*"];
}
