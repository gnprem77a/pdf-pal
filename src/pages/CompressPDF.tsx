import { useState } from "react";
import { FileDown } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { compressPDF, downloadBlob } from "@/lib/pdf-utils";

const CompressPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [compressionResult, setCompressionResult] = useState<{
    original: number;
    compressed: number;
  } | null>(null);

  const handleCompress = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const originalSize = files[0].size;
      setProgress(30);
      
      const compressedBlob = await compressPDF(files[0]);
      setProgress(80);

      setCompressionResult({
        original: originalSize,
        compressed: compressedBlob.size,
      });

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
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleCompress} className="px-8">
                Compress PDF
              </Button>
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
            <div className="mt-6 rounded-lg border bg-card p-6">
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
