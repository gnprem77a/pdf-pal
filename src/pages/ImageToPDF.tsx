import { useState } from "react";
import { Image } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/pdf-utils";
import { jsPDF } from "jspdf";

const ImageToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const doc = new jsPDF();
      let isFirstPage = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress((i / files.length) * 80);

        const imageData = await readFileAsDataURL(file);
        const img = await loadImage(imageData);

        // Calculate dimensions to fit the page
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        let imgWidth = img.width;
        let imgHeight = img.height;

        // Scale to fit
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;

        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        doc.addImage(imageData, "JPEG", x, y, imgWidth, imgHeight);
      }

      setProgress(90);
      const pdfBlob = doc.output("blob");
      downloadBlob(pdfBlob, "images-to-pdf.pdf");

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      setStatus("error");
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert images to PDF format"
      icon={Image}
      color="image"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
            multiple
            maxFiles={50}
            title="Drop your images here"
            description="Select JPG, PNG, or other image files"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert {files.length} Image{files.length > 1 ? "s" : ""} to PDF
              </Button>
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
                ? "Your PDF has been downloaded!"
                : "Converting images to PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert More Images</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ImageToPDF;
