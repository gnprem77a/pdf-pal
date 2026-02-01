import { useState, useRef, useCallback } from "react";
import { FileText, Type, Square, Circle, Pencil, Undo, Download, Trash2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import ProcessingStatus from "@/components/ProcessingStatus";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Tool = "text" | "rectangle" | "circle" | "freehand";

interface Annotation {
  id: string;
  type: Tool;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: { x: number; y: number }[];
  color: string;
  fontSize?: number;
}

const EditPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "editing" | "saving" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>("text");
  const [textInput, setTextInput] = useState("Your text here");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const pageDimensionsRef = useRef<{ width: number; height: number }[]>([]);

  const loadPDF = async () => {
    if (files.length === 0) return;

    setStatus("loading");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      pdfBytesRef.current = arrayBuffer;
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      setProgress(30);

      const images: string[] = [];
      const dimensions: { width: number; height: number }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        dimensions.push({ width: viewport.width, height: viewport.height });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        images.push(canvas.toDataURL("image/png"));
        
        setProgress(30 + (i / pdf.numPages) * 60);
      }

      pageDimensionsRef.current = dimensions;
      setPageImages(images);
      setProgress(100);
      setStatus("editing");
    } catch (error) {
      console.error("Load error:", error);
      setStatus("error");
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectedTool !== "text" || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: "text",
      page: currentPage,
      x,
      y,
      text: textInput,
      color,
      fontSize,
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === "text" || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawStart({ x, y });

    if (selectedTool === "freehand") {
      setCurrentPath([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "freehand") {
      setCurrentPath((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "rectangle" || selectedTool === "circle") {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: selectedTool,
        page: currentPage,
        x: Math.min(drawStart.x, x),
        y: Math.min(drawStart.y, y),
        width: Math.abs(x - drawStart.x),
        height: Math.abs(y - drawStart.y),
        color,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (selectedTool === "freehand" && currentPath.length > 1) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: "freehand",
        page: currentPage,
        x: 0,
        y: 0,
        points: currentPath,
        color,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentPath([]);
  };

  const undoLastAnnotation = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const clearPageAnnotations = () => {
    setAnnotations((prev) => prev.filter((a) => a.page !== currentPage));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const savePDF = async () => {
    if (!pdfBytesRef.current) return;

    setStatus("saving");
    setProgress(0);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      setProgress(30);

      for (const annotation of annotations) {
        const page = pages[annotation.page - 1];
        if (!page) continue;

        const { width: pageWidth, height: pageHeight } = page.getSize();
        const dims = pageDimensionsRef.current[annotation.page - 1];
        const scaleX = pageWidth / dims.width;
        const scaleY = pageHeight / dims.height;

        const { r, g, b } = hexToRgb(annotation.color);
        const pdfColor = rgb(r, g, b);

        // Convert canvas coordinates to PDF coordinates (PDF origin is bottom-left)
        const pdfX = annotation.x * scaleX;
        const pdfY = pageHeight - annotation.y * scaleY;

        if (annotation.type === "text" && annotation.text) {
          page.drawText(annotation.text, {
            x: pdfX,
            y: pdfY,
            size: (annotation.fontSize || 16) * scaleY,
            font,
            color: pdfColor,
          });
        } else if (annotation.type === "rectangle" && annotation.width && annotation.height) {
          page.drawRectangle({
            x: pdfX,
            y: pdfY - annotation.height * scaleY,
            width: annotation.width * scaleX,
            height: annotation.height * scaleY,
            borderColor: pdfColor,
            borderWidth: 2,
          });
        } else if (annotation.type === "circle" && annotation.width && annotation.height) {
          const radiusX = (annotation.width * scaleX) / 2;
          const radiusY = (annotation.height * scaleY) / 2;
          page.drawEllipse({
            x: pdfX + radiusX,
            y: pdfY - radiusY,
            xScale: radiusX,
            yScale: radiusY,
            borderColor: pdfColor,
            borderWidth: 2,
          });
        } else if (annotation.type === "freehand" && annotation.points) {
          // Draw freehand as connected lines
          for (let i = 1; i < annotation.points.length; i++) {
            const p1 = annotation.points[i - 1];
            const p2 = annotation.points[i];
            page.drawLine({
              start: { x: p1.x * scaleX, y: pageHeight - p1.y * scaleY },
              end: { x: p2.x * scaleX, y: pageHeight - p2.y * scaleY },
              thickness: 2,
              color: pdfColor,
            });
          }
        }
      }

      setProgress(80);

      const savedBytes = await pdfDoc.save();
      const buffer = new ArrayBuffer(savedBytes.length);
      new Uint8Array(buffer).set(savedBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-edited.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Save error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setCurrentPage(1);
    setTotalPages(0);
    setPageImages([]);
    setAnnotations([]);
    pdfBytesRef.current = null;
  };

  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text, shapes, and annotations to PDF files"
      icon={FileText}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to edit"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={loadPDF} className="px-8">
                Open Editor
              </Button>
            </div>
          )}
        </>
      ) : status === "loading" || status === "saving" ? (
        <ProcessingStatus
          status="processing"
          progress={progress}
          message={status === "loading" ? "Loading PDF..." : "Saving PDF..."}
        />
      ) : status === "editing" ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
            <div className="flex gap-1">
              {[
                { tool: "text" as Tool, icon: Type, label: "Text" },
                { tool: "rectangle" as Tool, icon: Square, label: "Rectangle" },
                { tool: "circle" as Tool, icon: Circle, label: "Circle" },
                { tool: "freehand" as Tool, icon: Pencil, label: "Draw" },
              ].map(({ tool, icon: Icon, label }) => (
                <Button
                  key={tool}
                  variant={selectedTool === tool ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool(tool)}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="h-6 w-px bg-border" />

            {selectedTool === "text" && (
              <div className="flex items-center gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-40"
                  placeholder="Text"
                />
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Size:</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(v) => setFontSize(v[0])}
                    min={8}
                    max={72}
                    step={1}
                    className="w-20"
                  />
                  <span className="w-8 text-xs">{fontSize}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label className="text-xs">Color:</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
            </div>

            <div className="h-6 w-px bg-border" />

            <Button variant="outline" size="sm" onClick={undoLastAnnotation} disabled={annotations.length === 0}>
              <Undo className="mr-1 h-4 w-4" />
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={clearPageAnnotations}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear Page
            </Button>

            <div className="ml-auto">
              <Button onClick={savePDF}>
                <Download className="mr-2 h-4 w-4" />
                Save PDF
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative mx-auto cursor-crosshair overflow-hidden rounded-lg border bg-white shadow-lg"
            style={{ width: "fit-content" }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          >
            <img
              src={pageImages[currentPage - 1]}
              alt={`Page ${currentPage}`}
              className="pointer-events-none select-none"
              draggable={false}
            />

            {/* Render annotations */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {pageAnnotations.map((ann) => {
                if (ann.type === "text") {
                  return (
                    <text
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      fill={ann.color}
                      fontSize={ann.fontSize}
                      fontFamily="Helvetica, sans-serif"
                    >
                      {ann.text}
                    </text>
                  );
                }
                if (ann.type === "rectangle") {
                  return (
                    <rect
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      width={ann.width}
                      height={ann.height}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={2}
                    />
                  );
                }
                if (ann.type === "circle") {
                  return (
                    <ellipse
                      key={ann.id}
                      cx={ann.x! + ann.width! / 2}
                      cy={ann.y! + ann.height! / 2}
                      rx={ann.width! / 2}
                      ry={ann.height! / 2}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={2}
                    />
                  );
                }
                if (ann.type === "freehand" && ann.points) {
                  const d = ann.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                  return <path key={ann.id} d={d} fill="none" stroke={ann.color} strokeWidth={2} />;
                }
                return null;
              })}

              {/* Current drawing preview */}
              {isDrawing && drawStart && selectedTool === "rectangle" && (
                <rect
                  x={Math.min(drawStart.x, currentPath[currentPath.length - 1]?.x || drawStart.x)}
                  y={Math.min(drawStart.y, currentPath[currentPath.length - 1]?.y || drawStart.y)}
                  width={Math.abs((currentPath[currentPath.length - 1]?.x || drawStart.x) - drawStart.x)}
                  height={Math.abs((currentPath[currentPath.length - 1]?.y || drawStart.y) - drawStart.y)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
              {isDrawing && currentPath.length > 1 && selectedTool === "freehand" && (
                <path
                  d={currentPath.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                />
              )}
            </svg>
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ProcessingStatus status="success" progress={100} message="Your edited PDF has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Edit Another PDF</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default EditPDF;
