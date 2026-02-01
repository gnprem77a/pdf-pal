import { useState, useEffect } from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob, getPDFPageCount } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const ReorderPages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageOrder(Array.from({ length: count }, (_, i) => i + 1));
    } else {
      setPageOrder([]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(pageOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPageOrder(items);
  };

  const handleReorder = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Copy pages in new order
      const indices = pageOrder.map((p) => p - 1);
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
    setPageOrder([]);
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

          {files.length > 0 && pageOrder.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-center text-muted-foreground">
                Drag pages to reorder them
              </p>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="pages">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {pageOrder.map((page, index) => (
                        <Draggable
                          key={`page-${page}`}
                          draggableId={`page-${page}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors ${
                                snapshot.isDragging
                                  ? "border-primary shadow-lg"
                                  : "border-border"
                              }`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">
                                {page}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Original Page {page} → Position {index + 1}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex justify-center">
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
