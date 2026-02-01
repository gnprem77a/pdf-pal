import { useState } from "react";
import { FileType } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const PDFToWord = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("pdfToWord", files, undefined, `${baseName}.docx`);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF files to editable Word documents"
      icon={FileType}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to Word"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to Word
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
                ? "Your Word document is ready for download!"
                : "Uploading and converting..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToWord;
