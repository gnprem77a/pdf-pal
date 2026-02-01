import { useState } from "react";
import { EyeOff } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const RedactPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleRedact = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("redactPdf", files, undefined, `${baseName}-redacted.pdf`);
  };

  const handleReset = () => { setFiles([]); reset(); };

  return (
    <ToolLayout title="Redact PDF" description="Permanently remove sensitive information from PDF documents" icon={EyeOff} color="protect">
      <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          <strong>Backend Required:</strong> Redaction requires server-side processing. Upload your PDF and the backend will handle redaction.
        </p>
      </div>
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload files={files} onFilesChange={setFiles} title="Drop your PDF file here" description="Select a PDF to redact" />
          {files.length > 0 && <div className="mt-6 flex justify-center"><Button size="lg" onClick={handleRedact} className="px-8">Redact PDF</Button></div>}
        </>
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message={status === "success" ? "Redacted PDF ready!" : "Processing..."} />
          {status === "success" && <div className="mt-6 flex justify-center"><Button onClick={handleReset}>Redact Another PDF</Button></div>}
        </>
      )}
    </ToolLayout>
  );
};

export default RedactPDF;
