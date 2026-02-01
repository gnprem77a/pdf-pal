import { useState } from "react";
import { Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";

interface RepairResult {
  success: boolean;
  originalSize: number;
  repairedSize: number;
  pagesRecovered: number;
  issues: string[];
}

const RepairPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRepair = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");
    setRepairResult(null);

    const issues: string[] = [];

    try {
      const originalSize = files[0].size;
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(20);

      // Try to load the PDF with recovery options
      let pdf: PDFDocument;
      try {
        pdf = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          updateMetadata: false,
        });
      } catch (loadError) {
        issues.push("PDF structure was corrupted - attempting recovery...");
        
        // Try more aggressive loading
        try {
          pdf = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false,
          });
        } catch {
          throw new Error("PDF is too corrupted to repair. The file structure is severely damaged.");
        }
      }

      setProgress(40);

      // Create a new clean PDF
      const newPdf = await PDFDocument.create();
      
      const pageCount = pdf.getPageCount();
      let recoveredPages = 0;

      for (let i = 0; i < pageCount; i++) {
        try {
          const [copiedPage] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(copiedPage);
          recoveredPages++;
        } catch (pageError) {
          issues.push(`Page ${i + 1} was damaged and could not be recovered`);
        }
        setProgress(40 + (i / pageCount) * 40);
      }

      if (recoveredPages === 0) {
        throw new Error("No pages could be recovered from the PDF.");
      }

      if (recoveredPages < pageCount) {
        issues.push(`${pageCount - recoveredPages} page(s) were too damaged to recover`);
      }

      setProgress(85);

      // Save the repaired PDF
      const repairedBytes = await newPdf.save({
        useObjectStreams: true,
      });

      setProgress(95);

      // Create blob and download
      const buffer = new ArrayBuffer(repairedBytes.length);
      new Uint8Array(buffer).set(repairedBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(blob, `${originalName}-repaired.pdf`);

      setRepairResult({
        success: true,
        originalSize,
        repairedSize: repairedBytes.length,
        pagesRecovered: recoveredPages,
        issues: issues.length > 0 ? issues : ["No major issues found - PDF structure has been optimized"],
      });

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Repair error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to repair PDF");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setRepairResult(null);
    setErrorMessage("");
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <ToolLayout
      title="Repair PDF"
      description="Fix corrupted or damaged PDF files"
      icon={Wrench}
      color="compress"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your corrupted PDF here"
            description="Select a PDF file that needs repair"
          />

          {errorMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Repair Failed</p>
                <p className="text-sm text-destructive/80">{errorMessage}</p>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleRepair} className="px-8">
                <Wrench className="mr-2 h-5 w-5" />
                Repair PDF
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Analyzing and repairing PDF structure..." />
      ) : (
        <>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-medium">Repair Complete</h3>
            </div>

            {repairResult && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Original Size</p>
                    <p className="text-lg font-semibold">{formatBytes(repairResult.originalSize)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Repaired Size</p>
                    <p className="text-lg font-semibold">{formatBytes(repairResult.repairedSize)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Pages Recovered</p>
                    <p className="text-lg font-semibold">{repairResult.pagesRecovered}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Repair Log:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {repairResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Repair Another PDF</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default RepairPDF;
