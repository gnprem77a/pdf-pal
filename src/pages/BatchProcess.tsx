import { useState } from "react";
import { Layers, Download, Trash2, FileDown, Merge } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
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

type BatchOperation = "compress" | "merge";

const BatchProcess = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [operation, setOperation] = useState<BatchOperation>("compress");
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setResults([]);

    try {
      if (operation === "merge") {
        // Merge all files into one
        setProgress(30);
        const mergedBlob = await mergePDFs(files);
        setProgress(90);
        setResults([{ name: "merged.pdf", blob: mergedBlob }]);
      } else {
        // Compress each file individually
        const compressedFiles: { name: string; blob: Blob }[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const compressedBlob = await compressPDF(file);
          compressedFiles.push({
            name: file.name.replace(".pdf", "-compressed.pdf"),
            blob: compressedBlob,
          });
          setProgress(((i + 1) / files.length) * 90);
        }
        
        setResults(compressedFiles);
      }

      setProgress(100);
      setStatus("success");
      toast({
        title: "Processing complete!",
        description: `${operation === "merge" ? "Files merged" : `${files.length} files compressed`} successfully.`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      setStatus("error");
      toast({
        title: "Error",
        description: "Failed to process files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadSingle = (result: { name: string; blob: Blob }) => {
    downloadBlob(result.blob, result.name);
  };

  const downloadAllAsZip = async () => {
    if (results.length === 1) {
      downloadSingle(results[0]);
      return;
    }
    
    await downloadAsZip(
      results.map((r) => r.blob),
      results.map((r) => r.name)
    );
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setResults([]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ToolLayout
      title="Batch Process"
      description="Process multiple PDF files at once"
      icon={Layers}
      color="merge"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            multiple
            title="Drop your PDF files here"
            description="Select multiple PDFs to process together"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* File List */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-4">
                  <h3 className="font-semibold text-foreground">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <FileDown className="h-4 w-4 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operation Selection */}
              <div className="space-y-2">
                <Label>Operation</Label>
                <Select value={operation} onValueChange={(v) => setOperation(v as BatchOperation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compress">
                      <div className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        Compress all files
                      </div>
                    </SelectItem>
                    <SelectItem value="merge">
                      <div className="flex items-center gap-2">
                        <Merge className="h-4 w-4" />
                        Merge into one PDF
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleProcess} className="px-8">
                  <Layers className="mr-2 h-4 w-4" />
                  Process {files.length} File{files.length > 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message={`Processing ${files.length} file${files.length > 1 ? "s" : ""}...`}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {results.length} File{results.length > 1 ? "s" : ""} Ready
            </h3>
            <Button onClick={downloadAllAsZip}>
              <Download className="mr-2 h-4 w-4" />
              Download {results.length > 1 ? "All (ZIP)" : ""}
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="divide-y">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <FileDown className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{result.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSize(result.blob.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSingle(result)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleReset}>Process More Files</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default BatchProcess;
