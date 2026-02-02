import { useState } from "react";
import { RotateCw } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const RotatePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [rotation, setRotation] = useState(90);

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleRotate = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "rotatePdf",
      files,
      { angle: rotation.toString() },
      `${baseName}-rotated.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setRotation(90);
    reset();
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate PDF pages to the correct orientation"
      icon={RotateCw}
      color="merge"
      previewFile={files.length > 0 ? files[0] : null}
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
                ? "Your rotated PDF is ready for download!"
                : "Uploading and rotating your PDF..."
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
