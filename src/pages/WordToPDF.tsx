import { useState } from "react";
import { FileType } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const WordToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name).replace(/\.(docx?|doc)$/i, "");
    await processFiles("wordToPdf", files, undefined, `${baseName}.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word documents to PDF format"
      icon={FileType}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".doc,.docx"
            title="Drop your Word file here"
            description="Select a .doc or .docx file to convert"
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

export default WordToPDF;
