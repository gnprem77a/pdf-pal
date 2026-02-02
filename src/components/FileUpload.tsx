import { forwardRef, useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PDFThumbnail from "@/components/PDFThumbnail";
import { useNativeFilePicker } from "@/hooks/use-native-file-picker";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

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
  title = "Select PDF files",
  description = "or drop PDFs here",
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(files);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onFilesChange(reordered);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // If files exist, show file list view
  if (files.length > 0) {
    return (
      <div className="w-full space-y-4" ref={ref}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="files">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {files.map((file, index) => (
                  <Draggable
                    key={`${file.name}-${index}`}
                    draggableId={`${file.name}-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border bg-white transition-all",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                        )}
                      >
                        {multiple && (
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <PDFThumbnail file={file} width={48} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-foreground">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add more files button */}
        {multiple && files.length < maxFiles && (
          <Button
            variant="outline"
            onClick={openFileDialog}
            className="w-full border-dashed h-12"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add more files ({files.length}/{maxFiles})
          </Button>
        )}

        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          ref={inputRef}
          className="sr-only"
        />
      </div>
    );
  }

  // Empty state - Clean centered upload like iLovePDF
  return (
    <div className="w-full flex flex-col items-center" ref={ref}>
      <div
        className={cn(
          "relative cursor-pointer transition-all duration-200",
          isDragging && "scale-105"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {/* Main upload button - iLovePDF style */}
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 h-14 px-10 text-lg font-semibold rounded-lg shadow-lg transition-all",
            "bg-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,55%)] text-white",
            isDragging && "ring-4 ring-[hsl(0,84%,60%)]/30 scale-105"
          )}
        >
          <Upload className="h-5 w-5" />
          {title}
        </button>
        
        {/* Cloud storage buttons (decorative) */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,55%)] text-white flex items-center justify-center shadow-md transition-colors"
            title="Google Drive"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.433 22l-1.6-2.8 6.533-11.333h3.2L6.033 22h-1.6zm7.467-13.6L5.367 2h3.2l6.533 6.4-3.2 0zm7.467 13.6h-1.6l-6.533-11.333L14.433 5l6.534 11.4-1.6 2.6z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,55%)] text-white flex items-center justify-center shadow-md transition-colors"
            title="Dropbox"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L18 2zM0 13.25L6 9.5l6 3.75L6 17 0 13.25zm18-3.75l6 3.75L18 17l-6-3.75 6-3.75zM6 18.25l6-3.75 6 3.75L12 22l-6-3.75z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Drop hint */}
      <p className="mt-4 text-sm text-muted-foreground">
        {description}
      </p>

      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        ref={inputRef}
        className="sr-only"
      />
    </div>
  );
});

FileUpload.displayName = "FileUpload";

export default FileUpload;
