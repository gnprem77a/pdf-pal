import { useState, useEffect } from "react";
import { FileCheck, AlertCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { convertPdfToPdfa, checkBackendHealth } from "@/lib/api-service";
import { downloadBlob } from "@/lib/pdf-utils";
import { API_CONFIG } from "@/lib/api-config";

const PDFToPDFA = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendConnected);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await convertPdfToPdfa(files[0]);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Conversion failed");
      }

      setProgress(80);
      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(result.data, `${originalName}-pdfa.pdf`);

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
      title="PDF to PDF/A"
      description="Convert PDF to archival format (PDF/A) for long-term preservation"
      icon={FileCheck}
      color="protect"
    >
      {/* Backend status banner */}
      <div className={`mb-4 rounded-lg border p-4 ${
        backendConnected === false 
          ? "border-yellow-500/30 bg-yellow-500/10" 
          : backendConnected === true 
          ? "border-green-500/30 bg-green-500/10"
          : "border-muted bg-muted/50"
      }`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`mt-0.5 h-5 w-5 ${
            backendConnected === false 
              ? "text-yellow-600" 
              : backendConnected === true 
              ? "text-green-600"
              : "text-muted-foreground"
          }`} />
          <div className="text-sm">
            {backendConnected === null && (
              <p className="text-muted-foreground">Checking backend connection...</p>
            )}
            {backendConnected === false && (
              <>
                <p className="font-medium text-yellow-700 dark:text-yellow-300">
                  Backend not connected
                </p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  Your Go backend at <code className="rounded bg-yellow-200/50 px-1">{API_CONFIG.baseUrl}</code> is not responding.
                </p>
                <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                  PDF/A conversion requires server-side processing. Set <code className="rounded bg-yellow-200/50 px-1">VITE_API_URL</code> to your API URL.
                </p>
              </>
            )}
            {backendConnected === true && (
              <p className="text-green-700 dark:text-green-300">
                ✓ Connected to backend at <code className="rounded bg-green-200/50 px-1">{API_CONFIG.baseUrl}</code>
              </p>
            )}
          </div>
        </div>
      </div>

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
            description="Select a PDF to convert to PDF/A format"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button 
                size="lg" 
                onClick={handleConvert} 
                className="px-8"
                disabled={backendConnected === false}
              >
                <FileCheck className="mr-2 h-5 w-5" />
                Convert to PDF/A
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Converting to PDF/A format..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your PDF/A file has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Convert Another PDF</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToPDFA;
