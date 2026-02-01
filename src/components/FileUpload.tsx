import { forwardRef, useCallback, useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PDFThumbnail from "@/components/PDFThumbnail";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  files: File[];
  title?: string;
  description?: string;
  showPreviews?: boolean;
}

const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(({
  accept = ".pdf",
  multiple = false,
  maxFiles = 10,
  onFilesChange,
  files,
  title = "Drop your files here",
  description = "or click to browse",
  showPreviews = true,
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.slice(0, maxFiles - files.length);
      onFilesChange([...files, ...validFiles]);
    },
    [files, maxFiles, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.slice(0, maxFiles - files.length);
        onFilesChange([...files, ...validFiles]);
      }

      // Allow selecting the same file again (some browsers won't fire change otherwise)
      e.target.value = "";
    },
    [files, maxFiles, onFilesChange]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full" ref={ref}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          files.length > 0 && "pb-6"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          ref={inputRef}
          className="sr-only"
        />
        
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
        
        {multiple && (
          <p className="mt-2 text-sm text-muted-foreground">
            Max {maxFiles} files
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className={cn(
          "mt-6",
          showPreviews && files.some(f => f.type === "application/pdf")
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            : "space-y-3"
        )}>
          {files.map((file, index) => {
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
            
            if (showPreviews && isPdf) {
              // Grid card with PDF thumbnail
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex flex-col items-center rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <PDFThumbnail file={file} width={100} showPageCount />
                  <p className="mt-2 w-full truncate text-center text-xs font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              );
            }
            
            // List row for non-PDF or when previews disabled
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = "FileUpload";

export default FileUpload;
