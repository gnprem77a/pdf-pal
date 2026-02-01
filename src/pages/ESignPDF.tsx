import { useState, useRef } from "react";
import { PenTool, Trash2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";
import { getApiUrl } from "@/lib/api-config";
import { triggerDownload } from "@/hooks/use-backend-pdf";
import { toast } from "sonner";

const ESignPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSign = async () => {
    if (files.length === 0 || !signatureData) return;

    setStatus("processing");
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file0", files[0]);
      formData.append("fileCount", "1");
      formData.append("signature", signatureData);

      setProgress(30);

      const response = await fetch(getApiUrl("signPdf"), {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error("Signing failed");
      }

      const result = await response.json();
      
      if (!result.downloadUrl) {
        throw new Error("No download URL returned");
      }

      setProgress(90);
      const baseName = getBaseName(files[0].name);
      triggerDownload(result.downloadUrl, `${baseName}-signed.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Sign error:", error);
      toast.error("Signing failed", {
        description: error instanceof Error ? error.message : "Please check your backend server",
      });
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    clearSignature();
  };

  return (
    <ToolLayout
      title="E-Sign PDF"
      description="Add your signature to PDF documents"
      icon={PenTool}
      color="protect"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to sign"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Draw Your Signature</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Draw your signature above. It will be placed on the first page.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleSign}
                  className="px-8"
                  disabled={!signatureData}
                >
                  Sign PDF
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus
            status={status === "processing" ? "processing" : status}
            progress={progress}
            message={
              status === "success"
                ? "Your signed PDF is ready for download!"
                : "Adding signature..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Sign Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ESignPDF;
