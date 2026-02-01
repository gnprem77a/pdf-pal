import { useState } from "react";
import { Crop } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { downloadBlob } from "@/lib/pdf-utils";

const CropPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [margins, setMargins] = useState({ top: 50, right: 50, bottom: 50, left: 50 });

  const handleCrop = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(20);
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      setProgress(40);
      
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setCropBox(
          margins.left,
          margins.bottom,
          width - margins.left - margins.right,
          height - margins.top - margins.bottom
        );
      }

      setProgress(80);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      
      const originalName = files[0].name.replace(".pdf", "");
      await downloadBlob(blob, `${originalName}-cropped.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Crop error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setMargins({ top: 50, right: 50, bottom: 50, left: 50 });
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
                ? "Your cropped PDF has been downloaded!"
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
