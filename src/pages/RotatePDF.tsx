import { useState } from "react";
import { RotateCw } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { rotatePDF, downloadBlob } from "@/lib/pdf-utils";

const RotatePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState(90);

  const handleRotate = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(30);
      const rotatedBlob = await rotatePDF(files[0], rotation);
      setProgress(80);

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(rotatedBlob, `${originalName}-rotated.pdf`);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Rotate error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setRotation(90);
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate PDF pages to the correct orientation"
      icon={RotateCw}
      color="merge"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to rotate"
          />

          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-6 flex justify-center gap-3">
                {[90, 180, 270].map((angle) => (
                  <Button
                    key={angle}
                    variant={rotation === angle ? "default" : "outline"}
                    onClick={() => setRotation(angle)}
                    className="min-w-24"
                  >
                    {angle}°
                  </Button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleRotate} className="px-8">
                  Rotate {rotation}°
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
                ? "Your rotated PDF has been downloaded!"
                : "Rotating your PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Rotate Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default RotatePDF;
