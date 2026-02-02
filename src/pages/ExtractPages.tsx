import { useState } from "react";
import { FileOutput, Check } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ExtractPages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const { status, progress, processFiles, reset } = useBackendPdf();

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

  const selectAll = () => {
    setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
  };

  const deselectAll = () => {
    setSelectedPages([]);
  };

  const handleExtract = async () => {
    if (files.length === 0 || selectedPages.length === 0) return;
    
    const sortedPages = [...selectedPages].sort((a, b) => a - b);
    const baseName = getBaseName(files[0].name);
    
    await processFiles(
      "extractPages",
      files,
      { pages: JSON.stringify(sortedPages) },
      `${baseName}-extracted.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setPageCount(0);
    setSelectedPages([]);
    setPageThumbnails([]);
    reset();
  };

  return (
    <ToolLayout
      title="Extract Pages"
      description="Extract specific pages from your PDF document"
      icon={FileOutput}
      color="split"
      previewFile={files.length > 0 ? files[0] : null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to extract pages from"
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
                  Click on pages to select for extraction ({pageCount} pages total)
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
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
                          ? "border-primary ring-2 ring-primary/50" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={thumbnail}
                        alt={`Page ${pageNum}`}
                        className="w-full h-auto"
                      />
                      
                      {/* Page number badge */}
                      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium ${
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        Page {pageNum}
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
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
                    onClick={handleExtract}
                    className="px-8"
                  >
                    Extract {selectedPages.length} Page{selectedPages.length > 1 ? "s" : ""}
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
                ? "Your extracted PDF is ready for download!"
                : "Uploading and extracting pages..."
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
