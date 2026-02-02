import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdfjsLib } from "@/lib/pdfjs";
import { cn } from "@/lib/utils";

interface ToolPreviewPanelProps {
  file: File | null;
  className?: string;
}

const ToolPreviewPanel = ({ file, className }: ToolPreviewPanelProps) => {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPageImages([]);
      setCurrentPage(0);
      setTotalPages(0);
      return;
    }

    const loadPDF = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);

        const images: string[] = [];
        const pagesToRender = Math.min(pdf.numPages, 20);

        for (let i = 1; i <= pagesToRender; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;
          
          images.push(canvas.toDataURL("image/jpeg", 0.8));
        }

        setPageImages(images);
        setCurrentPage(0);
      } catch (error) {
        console.error("PDF preview error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(pageImages.length - 1, prev + 1));
  }, [pageImages.length]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.25, prev - 0.25));
  }, []);

  // Empty state
  if (!file) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-muted/30",
        className
      )}>
        <div className="text-center p-8">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Upload a PDF to preview
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-muted/30",
        className
      )}>
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageImages.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-muted/30",
        className
      )}>
        <div className="text-center p-8">
          <FileText className="w-12 h-12 mx-auto mb-3 text-destructive/50" />
          <p className="text-sm text-muted-foreground">Unable to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[60px] text-center">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextPage}
            disabled={currentPage >= pageImages.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div 
          className="flex justify-center"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          <img
            src={pageImages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="shadow-lg rounded border max-w-full"
          />
        </div>
      </div>

      {/* Page Thumbnails */}
      {pageImages.length > 1 && (
        <div className="border-t bg-muted/50 p-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pageImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "shrink-0 rounded overflow-hidden border-2 transition-all hover:scale-105",
                  currentPage === index 
                    ? "border-primary" 
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img
                  src={img}
                  alt={`Page ${index + 1}`}
                  className="h-10 w-auto object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPreviewPanel;
