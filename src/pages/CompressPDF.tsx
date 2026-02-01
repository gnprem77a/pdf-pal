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
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";
import { toast } from "@/hooks/use-toast";

type SizeUnit = "KB" | "MB";

const CompressPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  
  // Target size settings
  const [useTargetSize, setUseTargetSize] = useState(false);
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<SizeUnit>("KB");

  const { status, progress, processFiles, reset } = useBackendPdf();

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

    const baseName = getBaseName(files[0].name);
    const params: Record<string, string> = {};
    
    if (useTargetSize) {
      params.targetSize = targetBytes.toString();
    }

    await processFiles(
      "compressPdf",
      files,
      Object.keys(params).length > 0 ? params : undefined,
      `${baseName}-compressed.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    reset();
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
                ? "Your compressed PDF is ready for download!"
                : "Uploading and compressing your PDF..."
            }
          />

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
