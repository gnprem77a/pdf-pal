import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Maximize2, Minimize2 } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

        // Render all pages for full preview
        const images: string[] = [];
        const pagesToRender = Math.min(pdf.numPages, 20); // Limit to 20 pages for performance

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
        "flex flex-col items-center justify-center h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm",
        className
      )}>
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">PDF Preview</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Upload a PDF file to see the preview here
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm",
        className
      )}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageImages.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm",
        className
      )}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-destructive/50" />
          </div>
          <p className="text-sm text-muted-foreground">Unable to preview PDF</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300",
        isExpanded && "fixed inset-4 z-50 bg-card",
        className
      )}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
            {currentPage + 1} / {totalPages}
            {totalPages > 20 && <span className="text-[10px]"> (max 20)</span>}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
            className="h-8 w-8"
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
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-muted/5 to-muted/20 p-4">
        <div 
          className="flex justify-center transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          <img
            src={pageImages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="shadow-xl rounded-lg border border-border/30 max-w-full"
            style={{ 
              maxHeight: isExpanded ? "calc(100vh - 120px)" : "auto",
            }}
          />
        </div>
      </div>

      {/* Page Thumbnails */}
      {pageImages.length > 1 && (
        <div className="border-t border-border/50 bg-muted/30 p-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pageImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105",
                  currentPage === index 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-border/50 hover:border-primary/50"
                )}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-12 w-auto object-contain"
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
