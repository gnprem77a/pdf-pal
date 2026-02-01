import { useEffect, useRef, useState } from "react";
import { pdfjsLib } from "@/lib/pdfjs";
import { Loader2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFThumbnailProps {
  file: File;
  width?: number;
  className?: string;
  showPageCount?: boolean;
}

const PDFThumbnail = ({
  file,
  width = 120,
  className,
  showPageCount = true,
}: PDFThumbnailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const renderThumbnail = async () => {
      if (!canvasRef.current) return;

      setLoading(true);
      setError(false);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (cancelled) return;

        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });

        // Calculate scale to fit desired width
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context || cancelled) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;

        setLoading(false);
      } catch (err) {
        console.error("Failed to render PDF thumbnail:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [file, width]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-lg border bg-muted/30",
        className
      )}
      style={{ width }}
    >
      {loading && (
        <div
          className="flex items-center justify-center bg-muted/50"
          style={{ width, height: width * 1.4 }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div
          className="flex flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground"
          style={{ width, height: width * 1.4 }}
        >
          <FileWarning className="h-8 w-8" />
          <span className="text-xs">Preview failed</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={cn("block", loading || error ? "hidden" : "")}
      />

      {showPageCount && pageCount > 0 && !loading && !error && (
        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </div>
      )}
    </div>
  );
};

export default PDFThumbnail;
