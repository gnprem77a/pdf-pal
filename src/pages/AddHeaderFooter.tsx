import { useState } from "react";
import { AlignVerticalSpaceAround } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument, rgb } from "pdf-lib";

const AddHeaderFooter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");

  const handleAdd = async () => {
    if (files.length === 0 || (!header && !footer)) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();

      setProgress(50);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = 10;

        if (header) {
          page.drawText(header, {
            x: width / 2 - (header.length * fontSize) / 4,
            y: height - 25,
            size: fontSize,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        if (footer) {
          page.drawText(footer, {
            x: width / 2 - (footer.length * fontSize) / 4,
            y: 20,
            size: fontSize,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      });

      setProgress(80);
      const pdfBytes = await pdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-headers.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Header/footer error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setHeader("");
    setFooter("");
  };

  return (
    <ToolLayout
      title="Add Header & Footer"
      description="Insert custom headers and footers to your PDF"
      icon={AlignVerticalSpaceAround}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to add headers/footers"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header">Header Text</Label>
                <Input
                  id="header"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="Text to appear at the top of each page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer">Footer Text</Label>
                <Input
                  id="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Text to appear at the bottom of each page"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleAdd}
                  className="px-8"
                  disabled={!header && !footer}
                >
                  Add Header & Footer
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
                ? "Your PDF with headers/footers has been downloaded!"
                : "Adding headers and footers..."
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

export default AddHeaderFooter;
