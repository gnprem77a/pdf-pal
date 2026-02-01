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
import { mergePDFs, compressPDF, downloadBlob, downloadAsZip } from "@/lib/pdf-utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import BatchFileCard, { BatchFileItem, FileStatus } from "@/components/BatchFileCard";

type BatchOperation = "compress" | "merge";

const BatchProcess = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [queue, setQueue] = useState<BatchFileItem[]>([]);
  const [operation, setOperation] = useState<BatchOperation>("compress");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mergeResult, setMergeResult] = useState<Blob | null>(null);
  const pauseRef = useRef(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    // Create queue items for new files
    const newItems: BatchFileItem[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      status: "pending" as FileStatus,
      progress: 0,
    }));
    setQueue(newItems);
    setMergeResult(null);
  };

  const updateQueueItem = useCallback((id: string, updates: Partial<BatchFileItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const processCompression = async () => {
    setIsProcessing(true);
    pauseRef.current = false;

    for (const item of queue) {
      if (item.status === "complete") continue;
      
      // Check for pause
      while (pauseRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      updateQueueItem(item.id, { status: "processing", progress: 0 });

      try {
        // Simulate progress updates
        for (let p = 10; p <= 80; p += 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          updateQueueItem(item.id, { progress: p });
        }

        const compressedBlob = await compressPDF(item.file);
        
        updateQueueItem(item.id, {
          status: "complete",
          progress: 100,
          result: compressedBlob,
        });
      } catch (error) {
        console.error("Compression error:", error);
        updateQueueItem(item.id, {
          status: "error",
          progress: 0,
          error: "Failed to compress file",
        });
      }
    }

    setIsProcessing(false);
    setIsPaused(false);

    const completedCount = queue.filter((q) => q.status === "complete" || queue.find(i => i.id === q.id)?.status === "complete").length;
    toast({
      title: "Processing complete!",
      description: `${completedCount} file(s) compressed successfully.`,
    });
  };

  const processMerge = async () => {
    setIsProcessing(true);
    
    // Mark all as processing
    queue.forEach((item) => {
      updateQueueItem(item.id, { status: "processing", progress: 50 });
    });

    try {
      const mergedBlob = await mergePDFs(files);
      
      // Mark all as complete
      queue.forEach((item) => {
        updateQueueItem(item.id, { status: "complete", progress: 100 });
      });

      setMergeResult(mergedBlob);
      
      toast({
        title: "Merge complete!",
        description: `${files.length} files merged into one PDF.`,
      });
    } catch (error) {
      console.error("Merge error:", error);
      queue.forEach((item) => {
        updateQueueItem(item.id, { status: "error", error: "Failed to merge" });
      });
      toast({
        title: "Error",
        description: "Failed to merge files.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handleProcess = () => {
    if (operation === "compress") {
      processCompression();
    } else {
      processMerge();
    }
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const handleRetry = (id: string) => {
    updateQueueItem(id, { status: "pending", progress: 0, error: undefined });
  };

  const handleRemove = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setFiles((prev) => {
      const item = queue.find((q) => q.id === id);
      return item ? prev.filter((f) => f !== item.file) : prev;
    });
  };

  const handleDownloadSingle = async (item: BatchFileItem) => {
    if (item.result) {
      const name = item.file.name.replace(".pdf", "-compressed.pdf");
      await downloadBlob(item.result, name);
    }
  };

  const handleDownloadAll = async () => {
    if (operation === "merge" && mergeResult) {
      await downloadBlob(mergeResult, "merged.pdf");
      return;
    }

    const completedItems = queue.filter((item) => item.status === "complete" && item.result);
    if (completedItems.length === 1) {
      handleDownloadSingle(completedItems[0]);
      return;
    }

    await downloadAsZip(
      completedItems.map((item) => item.result!),
      completedItems.map((item) => item.file.name.replace(".pdf", "-compressed.pdf"))
    );
  };

  const handleReset = () => {
    setFiles([]);
    setQueue([]);
    setIsProcessing(false);
    setIsPaused(false);
    setMergeResult(null);
  };

  const retryAll = () => {
    queue.forEach((item) => {
      if (item.status === "error") {
        updateQueueItem(item.id, { status: "pending", progress: 0, error: undefined });
      }
    });
    handleProcess();
  };

  // Statistics
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
  const hasErrors = stats.error > 0;

  return (
    <ToolLayout
      title="Batch Process"
      description="Process multiple PDF files with real-time progress tracking"
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
          {/* Header Stats */}
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

              {/* Operation Selector */}
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

            {/* Overall Progress Bar */}
            {hasStarted && (
              <div className="mt-4">
                <Progress value={overallProgress} className="h-3" />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {overallProgress}% complete
                </p>
              </div>
            )}
          </div>

          {/* File Queue */}
          <div className="space-y-3">
            {queue.map((item) => (
              <BatchFileCard
                key={item.id}
                item={item}
                onRetry={handleRetry}
                onRemove={handleRemove}
                onDownload={handleDownloadSingle}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {!hasStarted && (
              <>
                <Button size="lg" onClick={handleProcess} className="px-8">
                  <Play className="mr-2 h-4 w-4" />
                  Start Processing
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset}>
                  Clear All
                </Button>
              </>
            )}

            {isProcessing && operation === "compress" && (
              <Button
                size="lg"
                variant={isPaused ? "default" : "outline"}
                onClick={togglePause}
              >
                {isPaused ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
            )}

            {allComplete && (
              <>
                <Button size="lg" onClick={handleDownloadAll}>
                  <Download className="mr-2 h-4 w-4" />
                  Download {operation === "merge" ? "Merged PDF" : `All (${stats.complete})`}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset}>
                  Process More Files
                </Button>
              </>
            )}

            {hasErrors && !isProcessing && (
              <Button size="lg" variant="outline" onClick={retryAll}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Failed ({stats.error})
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default BatchProcess;
