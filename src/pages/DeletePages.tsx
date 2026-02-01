import { useState } from "react";
import { Trash2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getPDFPageCount, downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";

const DeletePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setSelectedPages([]);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
    } else {
      setPageCount(0);
    }
  };

  const togglePage = (page: number) => {
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  };

  const handleDelete = async () => {
    if (files.length === 0 || selectedPages.length === 0) return;
    if (selectedPages.length >= pageCount) {
      alert("You cannot delete all pages!");
      return;
    }

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Get pages to keep (not selected for deletion)
      const pagesToKeep = [];
      for (let i = 0; i < pageCount; i++) {
        if (!selectedPages.includes(i + 1)) {
          pagesToKeep.push(i);
        }
      }

      setProgress(50);
      const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
      copiedPages.forEach((page) => newPdf.addPage(page));

      setProgress(80);
      const pdfBytes = await newPdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-modified.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Delete pages error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setPageCount(0);
    setSelectedPages([]);
  };

  return (
    <ToolLayout
      title="Delete Pages"
      description="Remove specific pages from your PDF"
      icon={Trash2}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to remove pages"
          />

          {files.length > 0 && pageCount > 0 && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="font-medium text-foreground">
                  Select pages to delete ({pageCount} pages total)
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                  <div
                    key={page}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`page-${page}`}
                      checked={selectedPages.includes(page)}
                      onCheckedChange={() => togglePage(page)}
                    />
                    <Label
                      htmlFor={`page-${page}`}
                      className="text-sm cursor-pointer"
                    >
                      {page}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedPages.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleDelete}
                    className="px-8"
                    variant="destructive"
                  >
                    Delete {selectedPages.length} Page{selectedPages.length > 1 ? "s" : ""}
                  </Button>
                </div>
              )}
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
                ? "Your modified PDF has been downloaded!"
                : "Removing pages..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Edit Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default DeletePages;
