import { useState } from "react";
import { Presentation } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import * as pdfjsLib from "pdfjs-dist";
import pptxgen from "pptxgenjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFToPowerPoint = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setProgress(20);

      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Render page to canvas
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        
        // Convert canvas to base64 image
        const imageData = canvas.toDataURL("image/jpeg", 0.9);

        // Add slide with the page image
        const slide = pptx.addSlide();
        slide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
        });

        setProgress(20 + (pageNum / pdf.numPages) * 70);
      }

      setProgress(95);
      
      // Generate and download
      const originalName = files[0].name.replace(".pdf", "");
      await pptx.writeFile({ fileName: `${originalName}.pptx` });

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Conversion failed");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <ToolLayout
      title="PDF to PowerPoint"
      description="Convert PDF files to PowerPoint presentations"
      icon={Presentation}
      color="image"
    >
      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Client-side conversion:</strong> Each PDF page becomes a slide image. Text won't be editable in the resulting PowerPoint.
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to PowerPoint"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PowerPoint
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Converting PDF to PowerPoint..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your PowerPoint has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Convert Another File</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToPowerPoint;
