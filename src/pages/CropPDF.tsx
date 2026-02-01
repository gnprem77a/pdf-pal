import { useState } from "react";
import { Crop } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const CropPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [margins, setMargins] = useState({ top: 50, right: 50, bottom: 50, left: 50 });

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleCrop = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "cropPdf",
      files,
      { 
        top: margins.top.toString(),
        right: margins.right.toString(),
        bottom: margins.bottom.toString(),
        left: margins.left.toString(),
      },
      `${baseName}-cropped.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setMargins({ top: 50, right: 50, bottom: 50, left: 50 });
    reset();
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Adjust margins and crop PDF pages"
      icon={Crop}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to crop"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="top">Top Margin (px)</Label>
                  <Input
                    id="top"
                    type="number"
                    value={margins.top}
                    onChange={(e) => setMargins({ ...margins, top: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottom">Bottom Margin (px)</Label>
                  <Input
                    id="bottom"
                    type="number"
                    value={margins.bottom}
                    onChange={(e) => setMargins({ ...margins, bottom: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="left">Left Margin (px)</Label>
                  <Input
                    id="left"
                    type="number"
                    value={margins.left}
                    onChange={(e) => setMargins({ ...margins, left: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="right">Right Margin (px)</Label>
                  <Input
                    id="right"
                    type="number"
                    value={margins.right}
                    onChange={(e) => setMargins({ ...margins, right: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleCrop} className="px-8">
                  Crop PDF
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
                ? "Your cropped PDF is ready for download!"
                : "Cropping PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Crop Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default CropPDF;
