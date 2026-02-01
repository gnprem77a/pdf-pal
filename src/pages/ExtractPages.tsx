import { useState } from "react";
import { FileOutput } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { downloadBlob } from "@/lib/pdf-utils";

const ExtractPages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pageRange, setPageRange] = useState("1-3");

  const handleExtract = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(20);
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      setProgress(40);
      
      // Parse page range (e.g., "1-3, 5, 7-9")
      const pagesToExtract: number[] = [];
      const ranges = pageRange.split(",").map(r => r.trim());
      
      for (const range of ranges) {
        if (range.includes("-")) {
          const [start, end] = range.split("-").map(n => parseInt(n.trim()));
          for (let i = start; i <= end && i <= totalPages; i++) {
            if (i > 0) pagesToExtract.push(i - 1); // 0-indexed
          }
        } else {
          const page = parseInt(range);
          if (page > 0 && page <= totalPages) {
            pagesToExtract.push(page - 1);
          }
        }
      }

      setProgress(60);
      
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
      copiedPages.forEach(page => newPdf.addPage(page));

      setProgress(80);
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      
      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-extracted.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Extract error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setPageRange("1-3");
  };

  return (
    <ToolLayout
      title="Extract Pages"
      description="Extract specific pages from your PDF document"
      icon={FileOutput}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to extract pages from"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageRange">Pages to Extract</Label>
                <Input
                  id="pageRange"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g., 1-3, 5, 7-9"
                />
                <p className="text-xs text-muted-foreground">
                  Enter page numbers or ranges separated by commas
                </p>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleExtract} className="px-8">
                  Extract Pages
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
                ? "Your extracted PDF has been downloaded!"
                : "Extracting pages..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Extract More Pages</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ExtractPages;
