import { useState } from "react";
import { Camera } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useBackendPdf } from "@/hooks/use-backend-pdf";

const ScanToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    // Use dedicated scan-to-pdf endpoint with enhancement + OCR
    await processFiles("scanToPdf", files, undefined, "scanned-document.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Scan to PDF"
      description="Convert scanned images to searchable PDF with auto-enhancement"
      icon={Camera}
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
            title="Drop scanned images here"
            description="Images will be enhanced (deskew, contrast) and OCR'd for searchable text"
          />
          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Create Searchable PDF ({files.length} image{files.length > 1 ? "s" : ""})
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
                ? "Your searchable PDF is ready!"
                : "Enhancing images and applying OCR..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Scan More Documents</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ScanToPDF;
