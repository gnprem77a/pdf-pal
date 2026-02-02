import { forwardRef, useCallback, useRef, useState } from "react";
import { Upload, X, FileText, CloudUpload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PDFThumbnail from "@/components/PDFThumbnail";
import { useNativeFilePicker } from "@/hooks/use-native-file-picker";

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
  const { pickFiles: nativePickFiles, isNative } = useNativeFilePicker();

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
      e.target.value = "";
    },
    [files, maxFiles, onFilesChange]
  );

  const openFileDialog = useCallback(async () => {
    if (isNative) {
      const pickedFiles = await nativePickFiles({
        accept,
        multiple,
        maxFiles: maxFiles - files.length,
      });
      if (pickedFiles.length > 0) {
        onFilesChange([...files, ...pickedFiles]);
      }
    } else {
      inputRef.current?.click();
    }
  }, [isNative, nativePickFiles, accept, multiple, maxFiles, files, onFilesChange]);

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
          "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 md:p-12 transition-all duration-500 cursor-pointer",
          "bg-gradient-to-b from-transparent to-secondary/20",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02] shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]"
            : "border-muted-foreground/30 hover:border-primary/60 hover:bg-secondary/30 hover:shadow-lg",
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
        
        {/* Animated upload icon */}
        <div className={cn(
          "relative mb-6 transition-all duration-500",
          isDragging ? "scale-125" : "group-hover:scale-110"
        )}>
          {/* Outer glow ring */}
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            isDragging 
              ? "bg-primary/30 animate-ping" 
              : "bg-primary/0 group-hover:bg-primary/10"
          )} style={{ transform: 'scale(1.5)' }} />
          
          {/* Icon container */}
          <div className={cn(
            "relative rounded-full p-5 transition-all duration-500",
            "bg-gradient-to-br from-primary/20 to-primary/5",
            "ring-2 ring-primary/20",
            isDragging && "ring-primary/50 bg-primary/20"
          )}>
            <CloudUpload className={cn(
              "h-10 w-10 text-primary transition-all duration-500",
              isDragging && "animate-bounce-subtle"
            )} />
          </div>
          
          {/* Sparkle decorations */}
          <Sparkles className={cn(
            "absolute -top-2 -right-2 h-5 w-5 text-primary transition-all duration-300",
            isDragging ? "opacity-100 animate-pulse-soft" : "opacity-0 group-hover:opacity-70"
          )} />
        </div>
        
        {/* Text content */}
        <h3 className={cn(
          "mb-2 text-xl font-semibold text-foreground transition-all duration-300",
          isDragging && "text-primary"
        )}>
          {isDragging ? "Release to upload" : title}
        </h3>
        <p className="text-muted-foreground text-center">
          {description}
        </p>
        
        {/* Supported formats hint */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="px-2 py-1 rounded-full bg-secondary/50">
            {accept.split(',').map(a => a.trim().replace('.', '').toUpperCase()).join(' • ')}
          </span>
        </div>
        
        {multiple && (
          <p className="mt-3 text-sm text-muted-foreground">
            Max {maxFiles} files
          </p>
        )}

        {/* Decorative corners */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-primary/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-primary/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-primary/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-primary/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className={cn(
          "mt-6 animate-fade-in",
          showPreviews && files.some(f => f.type === "application/pdf")
            ? "grid grid-cols-2 sm:grid-cols-3 gap-4"
            : "space-y-3"
        )}>
          {files.map((file, index) => {
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
            
            if (showPreviews && isPdf) {
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={cn(
                    "group/card relative flex flex-col items-center rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02] hover:border-primary/30"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className={cn(
                      "absolute -right-2 -top-2 h-7 w-7 rounded-full",
                      "bg-destructive/90 text-destructive-foreground",
                      "opacity-0 shadow-lg transition-all duration-200",
                      "group-hover/card:opacity-100 hover:scale-110 hover:bg-destructive"
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  
                  <div className="rounded-lg overflow-hidden ring-1 ring-border/50">
                    <PDFThumbnail file={file} width={100} showPageCount />
                  </div>
                  
                  <p className="mt-3 w-full truncate text-center text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              );
            }
            
            return (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  "group/item flex items-center gap-4 rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300",
                  "hover:shadow-md hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 ring-1 ring-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
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
                  className="shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
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