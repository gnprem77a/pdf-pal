import { useState } from "react";
import { FileDown, Target } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compressPDF, downloadBlob } from "@/lib/pdf-utils";
import { toast } from "@/hooks/use-toast";

type SizeUnit = "KB" | "MB";

const CompressPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [compressionResult, setCompressionResult] = useState<{
    original: number;
    compressed: number;
    targetReached: boolean;
  } | null>(null);
  
  // Target size settings
  const [useTargetSize, setUseTargetSize] = useState(false);
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<SizeUnit>("KB");

  const getTargetBytes = () => {
    const size = parseFloat(targetSize) || 0;
    return targetUnit === "MB" ? size * 1024 * 1024 : size * 1024;
  };

  const handleCompress = async () => {
    if (files.length === 0) return;

    const targetBytes = useTargetSize ? getTargetBytes() : 0;
    
    if (useTargetSize && targetBytes <= 0) {
      toast({
        title: "Invalid target size",
        description: "Please enter a valid target size greater than 0",
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");
    setProgress(0);

    try {
      const originalSize = files[0].size;
      setProgress(30);
      
      const compressedBlob = await compressPDF(files[0]);
      setProgress(80);

      const compressedSize = compressedBlob.size;
      const targetReached = !useTargetSize || compressedSize <= targetBytes;

      setCompressionResult({
        original: originalSize,
        compressed: compressedSize,
        targetReached,
      });

      if (useTargetSize && !targetReached) {
        toast({
          title: "Target size not reached",
          description: `Best compression achieved: ${formatSize(compressedSize)}. For smaller sizes, consider removing pages or reducing image quality externally.`,
          variant: "default",
        });
      }

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(compressedBlob, `${originalName}-compressed.pdf`);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Compress error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setCompressionResult(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCompressionPercentage = () => {
    if (!compressionResult) return 0;
    const reduction =
      ((compressionResult.original - compressionResult.compressed) /
        compressionResult.original) *
      100;
    return Math.max(0, reduction).toFixed(1);
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality"
      icon={FileDown}
      color="compress"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to compress"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* File info */}
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Current file size</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatSize(files[0].size)}
                </p>
              </div>

              {/* Target size toggle */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="target-toggle" className="text-base font-medium">
                      Set target file size
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Specify your desired output size
                    </p>
                  </div>
                  <Switch
                    id="target-toggle"
                    checked={useTargetSize}
                    onCheckedChange={setUseTargetSize}
                  />
                </div>

                {useTargetSize && (
                  <div className="flex items-center gap-3 pt-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        value={targetSize}
                        onChange={(e) => setTargetSize(e.target.value)}
                        placeholder="500"
                        className="w-24"
                        min="1"
                      />
                      <Select value={targetUnit} onValueChange={(v) => setTargetUnit(v as SizeUnit)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KB">KB</SelectItem>
                          <SelectItem value="MB">MB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {parseFloat(targetSize) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Target: {formatSize(getTargetBytes())}
                      </span>
                    )}
                  </div>
                )}

                {useTargetSize && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    💡 Note: Browser-based compression has limitations. Very aggressive compression may not always be achievable client-side.
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleCompress} className="px-8">
                  {useTargetSize 
                    ? `Compress to ${targetSize} ${targetUnit}` 
                    : "Compress PDF"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message={
              status === "success"
                ? "Your compressed PDF has been downloaded!"
                : "Compressing your PDF..."
            }
          />

          {status === "success" && compressionResult && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Original</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatSize(compressionResult.original)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compressed</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatSize(compressionResult.compressed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saved</p>
                    <p className="text-lg font-semibold text-green-500">
                      {getCompressionPercentage()}%
                    </p>
                  </div>
                </div>
              </div>

              {useTargetSize && (
                <div className={`rounded-lg border p-4 ${
                  compressionResult.targetReached 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  <p className={`text-sm font-medium ${
                    compressionResult.targetReached 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}>
                    {compressionResult.targetReached 
                      ? `✓ Target size of ${targetSize} ${targetUnit} reached!`
                      : `⚠ Could not reach target of ${targetSize} ${targetUnit}. Best result: ${formatSize(compressionResult.compressed)}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Compress Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default CompressPDF;
