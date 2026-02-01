import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
  file: File | Blob | null;
  className?: string;
  maxHeight?: number;
}

const PDFPreview = ({ file, className = "", maxHeight = 400 }: PDFPreviewProps) => {
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

        // Render first 3 pages for preview
        const images: string[] = [];
        const pagesToRender = Math.min(pdf.numPages, 3);

        for (let i = 1; i <= pagesToRender; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          } as Parameters<typeof page.render>[0];

          await page.render(renderContext).promise;
          images.push(canvas.toDataURL("image/png"));
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

  if (!file) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${className}`} style={{ minHeight: 200 }}>
        <p className="text-sm text-muted-foreground">No PDF selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${className}`} style={{ minHeight: 200 }}>
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (pageImages.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${className}`} style={{ minHeight: 200 }}>
        <p className="text-sm text-muted-foreground">Unable to preview PDF</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-card overflow-hidden ${className}`}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
            {totalPages > 3 && " (preview limited to 3)"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(Math.min(pageImages.length - 1, currentPage + 1))}
            disabled={currentPage >= pageImages.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Image */}
      <div 
        className="overflow-auto bg-muted/10 p-4"
        style={{ maxHeight }}
      >
        <div className="flex justify-center">
          <img
            src={pageImages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="shadow-lg rounded"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
