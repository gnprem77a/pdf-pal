import { useState } from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import * as pdfjsLib from "pdfjs-dist";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PageItem {
  id: string;
  originalPage: number;
  thumbnail: string;
}

const ReorderPages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  const generateThumbnails = async (file: File) => {
    setLoadingThumbnails(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageItems: PageItem[] = [];

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
          
          pageItems.push({
            id: `page-${i}`,
            originalPage: i,
            thumbnail: canvas.toDataURL("image/jpeg", 0.7),
          });
        }
      }

      setPages(pageItems);
    } catch (error) {
      console.error("Error generating thumbnails:", error);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setPages([]);
    
    if (newFiles.length > 0) {
      await generateThumbnails(newFiles[0]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPages(items);
  };

  const handleReorder = async () => {
    if (files.length === 0 || pages.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Copy pages in new order
      const indices = pages.map((p) => p.originalPage - 1);
      const copiedPages = await newPdf.copyPages(pdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      setProgress(80);
      const pdfBytes = await newPdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-reordered.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Reorder error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setPages([]);
  };

  return (
    <ToolLayout
      title="Reorder Pages"
      description="Drag and drop to rearrange PDF pages"
      icon={ArrowUpDown}
      color="merge"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to reorder pages"
          />

          {loadingThumbnails && (
            <div className="mt-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading page previews...</p>
            </div>
          )}

          {files.length > 0 && pages.length > 0 && !loadingThumbnails && (
            <div className="mt-6 space-y-4">
              <p className="text-center text-muted-foreground">
                Drag pages to reorder them ({pages.length} pages)
              </p>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="pages" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    >
                      {pages.map((page, index) => (
                        <Draggable
                          key={page.id}
                          draggableId={page.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "border-primary shadow-lg scale-105 z-10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <img
                                src={page.thumbnail}
                                alt={`Page ${page.originalPage}`}
                                className="w-full h-auto"
                              />
                              
                              {/* Drag handle indicator */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>

                              {/* Page info badge */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                                Page {page.originalPage} → {index + 1}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleReorder} className="px-8">
                  Apply New Order
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
                ? "Your reordered PDF has been downloaded!"
                : "Reordering pages..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Reorder Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ReorderPages;
