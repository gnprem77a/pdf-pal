import { useState } from "react";
import { Presentation } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const PowerPointToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name).replace(/\.(ppt|pptx)$/i, "");
    await processFiles("powerpointToPdf", files, undefined, `${baseName}.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF format"
      icon={Presentation}
      color="image"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".ppt,.pptx"
            title="Drop your PowerPoint file here"
            description="Select a .ppt or .pptx file to convert"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PDF
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
                : "Uploading and converting..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another File</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default PowerPointToPDF;
