import { useState } from "react";
import { Stamp } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const WatermarkPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleWatermark = async () => {
    if (files.length === 0 || !watermarkText.trim()) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "watermarkPdf",
      files,
      { text: watermarkText },
      `${baseName}-watermarked.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setWatermarkText("CONFIDENTIAL");
    reset();
  };

  return (
    <ToolLayout
      title="Add Watermark"
      description="Add text watermark to your PDF files"
      icon={Stamp}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to watermark"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="watermark">Watermark Text</Label>
                <Input
                  id="watermark"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleWatermark}
                  className="px-8"
                  disabled={!watermarkText.trim()}
                >
                  Add Watermark
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
                ? "Your watermarked PDF is ready for download!"
                : "Uploading and adding watermark..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Watermark Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default WatermarkPDF;
