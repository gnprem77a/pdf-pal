import { useState } from "react";
import { Image } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf } from "@/hooks/use-backend-pdf";

const ImageToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    await processFiles("imageToPdf", files, undefined, "images-to-pdf.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert images to PDF format"
      icon={Image}
      color="image"
      previewFile={null}
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
                ? "Your PDF is ready for download!"
                : "Uploading and converting images..."
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
