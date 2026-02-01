import { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DeletePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const generateThumbnails = async (file: File) => {
    setLoadingThumbnails(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const thumbnails: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;
          
          thumbnails.push(canvas.toDataURL("image/jpeg", 0.7));
        }
      }

      setPageThumbnails(thumbnails);
      setPageCount(pdf.numPages);
    } catch (error) {
      console.error("Error generating thumbnails:", error);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setSelectedPages([]);
    setPageThumbnails([]);
    
    if (newFiles.length > 0) {
      await generateThumbnails(newFiles[0]);
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
      await downloadBlob(blob, `${originalName}-modified.pdf`);

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
    setPageThumbnails([]);
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

          {loadingThumbnails && (
            <div className="mt-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading page previews...</p>
            </div>
          )}

          {files.length > 0 && pageCount > 0 && !loadingThumbnails && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="font-medium text-foreground">
                  Click on pages to select for deletion ({pageCount} pages total)
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pageThumbnails.map((thumbnail, index) => {
                  const pageNum = index + 1;
                  const isSelected = selectedPages.includes(pageNum);
                  
                  return (
                    <div
                      key={pageNum}
                      onClick={() => togglePage(pageNum)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? "border-destructive ring-2 ring-destructive/50" 
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <img
                        src={thumbnail}
                        alt={`Page ${pageNum}`}
                        className={`w-full h-auto ${isSelected ? "opacity-50" : ""}`}
                      />
                      
                      {/* Page number badge */}
                      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium ${
                        isSelected 
                          ? "bg-destructive text-destructive-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        Page {pageNum}
                      </div>

                      {/* Delete indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                          <X className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedPages.length > 0 && (
                <div className="flex justify-center pt-4">
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
