import { useEffect, useState } from "react";

const RECENT_FILES_KEY = "pdftools-recent-files";
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  name: string;
  size: number;
  tool: string;
  toolPath: string;
  timestamp: number;
}

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent files", e);
      }
    }
  }, []);

  const addRecentFile = (file: File, tool: string, toolPath: string) => {
    const newEntry: RecentFile = {
      name: file.name,
      size: file.size,
      tool,
      toolPath,
      timestamp: Date.now(),
    };

    setRecentFiles((prev) => {
      // Remove duplicates and add new entry at the beginning
      const filtered = prev.filter((f) => f.name !== file.name || f.tool !== tool);
      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FILES);
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentFiles = () => {
    localStorage.removeItem(RECENT_FILES_KEY);
    setRecentFiles([]);
  };

  return { recentFiles, addRecentFile, clearRecentFiles };
}
