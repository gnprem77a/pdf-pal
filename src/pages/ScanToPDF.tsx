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
    await processFiles("scanToPdf", files, undefined, "scanned-document.pdf");
  };

  const handleReset = () => { setFiles([]); reset(); };

  return (
    <ToolLayout title="Scan to PDF" description="Convert scanned images to PDF" icon={Camera} color="image">
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload files={files} onFilesChange={setFiles} accept=".jpg,.jpeg,.png,.gif,.webp,.bmp" multiple maxFiles={50} title="Drop scanned images here" description="Select images to convert to PDF" />
          {files.length > 0 && <div className="mt-6 flex justify-center"><Button size="lg" onClick={handleConvert} className="px-8">Create PDF ({files.length} images)</Button></div>}
        </>
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message={status === "success" ? "PDF ready!" : "Creating PDF..."} />
          {status === "success" && <div className="mt-6 flex justify-center"><Button onClick={handleReset}>Scan More</Button></div>}
        </>
      )}
    </ToolLayout>
  );
};

export default ScanToPDF;
