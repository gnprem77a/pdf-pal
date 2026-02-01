import { useState, useRef, useEffect, useCallback } from "react";
import { EyeOff, ChevronLeft, ChevronRight, Trash2, RotateCcw } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument, rgb } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfjs";

interface RedactionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

const RedactPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [redactions, setRedactions] = useState<RedactionRect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<RedactionRect | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum + 1);
    const viewport = page.getViewport({ scale: 1 });
    
    // Calculate scale to fit container
    const containerWidth = containerRef.current?.clientWidth || 600;
    const maxWidth = Math.min(containerWidth - 32, 800);
    const newScale = maxWidth / viewport.width;
    setScale(newScale);

    const scaledViewport = page.getViewport({ scale: newScale });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    setPageSize({ width: scaledViewport.width, height: scaledViewport.height });

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      }).promise;
    }

    // Setup overlay canvas
    if (overlayRef.current) {
      overlayRef.current.width = scaledViewport.width;
      overlayRef.current.height = scaledViewport.height;
      drawRedactions();
    }
  }, [pdfDoc]);

  const drawRedactions = useCallback(() => {
    if (!overlayRef.current) return;
    
    const ctx = overlayRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

    // Draw existing redactions for current page
    const pageRedactions = redactions.filter((r) => r.pageIndex === currentPage);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    pageRedactions.forEach((rect) => {
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    });

    // Draw current drawing rect
    if (currentRect && currentRect.pageIndex === currentPage) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
      ctx.strokeStyle = "rgb(239, 68, 68)";
      ctx.lineWidth = 2;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  }, [redactions, currentPage, currentRect]);

  useEffect(() => {
    drawRedactions();
  }, [drawRedactions]);

  useEffect(() => {
    if (currentPage >= 0 && pdfDoc) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc, renderPage]);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setRedactions([]);
    setCurrentPage(0);
    
    if (newFiles.length > 0) {
      const arrayBuffer = await newFiles[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
    } else {
      setPdfDoc(null);
      setTotalPages(0);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentRect({
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      pageIndex: currentPage,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    
    const coords = getCanvasCoordinates(e);
    const width = coords.x - startPoint.x;
    const height = coords.y - startPoint.y;

    setCurrentRect({
      x: width >= 0 ? startPoint.x : coords.x,
      y: height >= 0 ? startPoint.y : coords.y,
      width: Math.abs(width),
      height: Math.abs(height),
      pageIndex: currentPage,
    });
  };

  const handleMouseUp = () => {
    if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
      setRedactions((prev) => [...prev, currentRect]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const removeRedaction = (index: number) => {
    setRedactions((prev) => prev.filter((_, i) => i !== index));
  };

  const clearPageRedactions = () => {
    setRedactions((prev) => prev.filter((r) => r.pageIndex !== currentPage));
  };

  const handleApplyRedactions = async () => {
    if (files.length === 0 || redactions.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(20);

      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const pages = pdfDocLib.getPages();
      
      setProgress(40);

      // Apply redactions to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageRedactions = redactions.filter((r) => r.pageIndex === i);
        const { height: pageHeight } = page.getSize();

        for (const rect of pageRedactions) {
          // Convert canvas coordinates to PDF coordinates
          // PDF origin is bottom-left, canvas origin is top-left
          const pdfX = rect.x / scale;
          const pdfY = pageHeight - (rect.y / scale) - (rect.height / scale);
          const pdfWidth = rect.width / scale;
          const pdfHeight = rect.height / scale;

          // Draw black rectangle over redacted area
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(0, 0, 0),
          });
        }

        setProgress(40 + ((i + 1) / pages.length) * 40);
      }

      setProgress(90);
      const pdfBytes = await pdfDocLib.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-redacted.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Redaction error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setRedactions([]);
    setCurrentPage(0);
    setPdfDoc(null);
    setTotalPages(0);
  };

  const pageRedactionCount = redactions.filter((r) => r.pageIndex === currentPage).length;
  const totalRedactionCount = redactions.length;

  return (
    <ToolLayout
      title="Redact PDF"
      description="Permanently remove sensitive information from PDF documents"
      icon={EyeOff}
      color="protect"
    >
      {status === "idle" || status === "error" ? (
        <>
          {!pdfDoc ? (
            <FileUpload
              files={files}
              onFilesChange={handleFileChange}
              title="Drop your PDF file here"
              description="Select a PDF to redact sensitive information"
            />
          ) : (
            <div className="space-y-4" ref={containerRef}>
              {/* Instructions */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-foreground">
                  <strong>Draw rectangles</strong> over areas you want to redact. Click and drag to select.
                </p>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Canvas Container */}
              <div className="relative mx-auto border rounded-lg overflow-hidden bg-muted/50" style={{ width: "fit-content" }}>
                <canvas ref={canvasRef} className="block" />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {/* Redaction Stats & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{pageRedactionCount}</span> redaction{pageRedactionCount !== 1 ? "s" : ""} on this page
                  {totalRedactionCount > pageRedactionCount && (
                    <span> • <span className="font-medium text-foreground">{totalRedactionCount}</span> total</span>
                  )}
                </div>
                
                {pageRedactionCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearPageRedactions}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear Page
                  </Button>
                )}
              </div>

              {/* Redaction List for Current Page */}
              {pageRedactionCount > 0 && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Redactions on this page:</p>
                  <div className="flex flex-wrap gap-2">
                    {redactions
                      .map((r, i) => ({ ...r, originalIndex: i }))
                      .filter((r) => r.pageIndex === currentPage)
                      .map((r, localIndex) => (
                        <div
                          key={r.originalIndex}
                          className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                        >
                          <span>Area {localIndex + 1}</span>
                          <button
                            onClick={() => removeRedaction(r.originalIndex)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={handleApplyRedactions}
                  disabled={totalRedactionCount === 0}
                  className="px-8"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Apply {totalRedactionCount} Redaction{totalRedactionCount !== 1 ? "s" : ""}
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset}>
                  Start Over
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
                ? "Your redacted PDF has been downloaded!"
                : "Applying redactions..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Redact Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default RedactPDF;
