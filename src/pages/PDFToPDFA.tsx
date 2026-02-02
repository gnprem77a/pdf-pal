import { useState } from "react";
import { FileCheck } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const PDFToPDFA = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("pdfToPdfa", files, undefined, `${baseName}-pdfa.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="PDF to PDF/A"
      description="Convert PDF to archival format (PDF/A) for long-term preservation"
      icon={FileCheck}
      color="protect"
      previewFile={files.length > 0 ? files[0] : null}
    >
      <div className="mb-4 rounded-lg border bg-muted/30 p-4">
        <h3 className="font-medium">What is PDF/A?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF/A is an ISO-standardized version of PDF designed for long-term digital preservation. 
          It embeds all fonts, disables encryption, and ensures the document can be viewed 
          consistently in the future.
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to PDF/A"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PDF/A
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
                ? "Your PDF/A file is ready for download!"
                : "Converting to PDF/A..."
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

export default PDFToPDFA;
