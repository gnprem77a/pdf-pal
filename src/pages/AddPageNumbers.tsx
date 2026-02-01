import { useState } from "react";
import { Hash } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument, rgb } from "pdf-lib";

type Position = "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";

const AddPageNumbers = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<Position>("bottom-center");

  const handleAddNumbers = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();
      const totalPages = pages.length;

      setProgress(50);

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumber = `${index + 1} / ${totalPages}`;
        const fontSize = 12;

        let x: number;
        let y: number;

        switch (position) {
          case "bottom-left":
            x = 40;
            y = 30;
            break;
          case "bottom-right":
            x = width - 60;
            y = 30;
            break;
          case "top-center":
            x = width / 2 - 15;
            y = height - 30;
            break;
          case "top-left":
            x = 40;
            y = height - 30;
            break;
          case "top-right":
            x = width - 60;
            y = height - 30;
            break;
          default: // bottom-center
            x = width / 2 - 15;
            y = 30;
        }

        page.drawText(pageNumber, {
          x,
          y,
          size: fontSize,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      setProgress(80);
      const pdfBytes = await pdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-numbered.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Add page numbers error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Insert page numbers to your PDF"
      icon={Hash}
      color="merge"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to add page numbers"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Position</Label>
                <RadioGroup
                  value={position}
                  onValueChange={(v) => setPosition(v as Position)}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { value: "top-left", label: "Top Left" },
                    { value: "top-center", label: "Top Center" },
                    { value: "top-right", label: "Top Right" },
                    { value: "bottom-left", label: "Bottom Left" },
                    { value: "bottom-center", label: "Bottom Center" },
                    { value: "bottom-right", label: "Bottom Right" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-sm cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleAddNumbers} className="px-8">
                  Add Page Numbers
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
                ? "Your PDF with page numbers has been downloaded!"
                : "Adding page numbers..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Process Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default AddPageNumbers;
