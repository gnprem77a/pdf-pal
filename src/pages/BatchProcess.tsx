import { useState, useCallback, useRef } from "react";
import { Layers, Download, FileDown, Merge, Play, Pause, RotateCcw } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import BatchFileCard, { BatchFileItem, FileStatus } from "@/components/BatchFileCard";
import { getApiUrl } from "@/lib/api-config";
import { triggerDownload } from "@/hooks/use-backend-pdf";

type BatchOperation = "compress" | "merge";

const BatchProcess = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [queue, setQueue] = useState<BatchFileItem[]>([]);
  const [operation, setOperation] = useState<BatchOperation>("compress");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    const newItems: BatchFileItem[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      status: "pending" as FileStatus,
      progress: 0,
    }));
    setQueue(newItems);
  };

  const updateQueueItem = useCallback((id: string, updates: Partial<BatchFileItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const processFiles = async () => {
    setIsProcessing(true);
    pauseRef.current = false;

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append("fileCount", files.length.toString());
      formData.append("operation", operation);

      // Update all items to processing
      queue.forEach((item) => {
        updateQueueItem(item.id, { status: "processing", progress: 50 });
      });

      const endpoint = operation === "merge" ? "mergePdf" : "batchProcess";
      const response = await fetch(getApiUrl(endpoint), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const result = await response.json();

      // Mark all as complete
      queue.forEach((item) => {
        updateQueueItem(item.id, { status: "complete", progress: 100 });
      });

      if (result.downloadUrl) {
        const filename = operation === "merge" ? "merged.pdf" : "processed.zip";
        triggerDownload(result.downloadUrl, filename);
      }

      toast({
        title: "Processing complete!",
        description: `${files.length} file(s) processed successfully.`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      queue.forEach((item) => {
        updateQueueItem(item.id, { status: "error", error: "Processing failed" });
      });
      toast({
        title: "Error",
        description: "Failed to process files.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    setFiles([]);
    setQueue([]);
    setIsProcessing(false);
    setIsPaused(false);
  };

  const stats = {
    total: queue.length,
    pending: queue.filter((q) => q.status === "pending").length,
    processing: queue.filter((q) => q.status === "processing").length,
    complete: queue.filter((q) => q.status === "complete").length,
    error: queue.filter((q) => q.status === "error").length,
  };

  const overallProgress = stats.total > 0 
    ? Math.round((stats.complete / stats.total) * 100) 
    : 0;

  const hasStarted = stats.complete > 0 || stats.processing > 0 || stats.error > 0;
  const allComplete = stats.complete === stats.total && stats.total > 0;

  return (
    <ToolLayout
      title="Batch Process"
      description="Process multiple PDF files at once"
      icon={Layers}
      color="merge"
    >
      {queue.length === 0 ? (
        <FileUpload
          files={files}
          onFilesChange={handleFilesChange}
          multiple
          title="Drop your PDF files here"
          description="Select multiple PDFs to process together"
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {stats.complete} of {stats.total} files processed
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {stats.pending > 0 && <span>⏳ {stats.pending} waiting</span>}
                  {stats.processing > 0 && <span>🔄 {stats.processing} processing</span>}
                  {stats.complete > 0 && <span>✅ {stats.complete} complete</span>}
                  {stats.error > 0 && <span>❌ {stats.error} failed</span>}
                </div>
              </div>

              {!hasStarted && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Operation:</Label>
                  <Select value={operation} onValueChange={(v) => setOperation(v as BatchOperation)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compress">
                        <div className="flex items-center gap-2">
                          <FileDown className="h-4 w-4" />
                          Compress
                        </div>
                      </SelectItem>
                      <SelectItem value="merge">
                        <div className="flex items-center gap-2">
                          <Merge className="h-4 w-4" />
                          Merge
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {hasStarted && (
              <div className="mt-4">
                <Progress value={overallProgress} className="h-3" />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {overallProgress}% complete
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <BatchFileCard
                key={item.id}
                item={item}
                onRetry={() => {}}
                onRemove={() => {}}
                onDownload={() => {}}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {!hasStarted && (
              <>
                <Button size="lg" onClick={processFiles} className="px-8">
                  <Play className="mr-2 h-4 w-4" />
                  Start Processing
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset}>
                  Clear All
                </Button>
              </>
            )}

            {allComplete && (
              <Button variant="outline" size="lg" onClick={handleReset}>
                Process More Files
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default BatchProcess;
