import { useState } from "react";
import { Merge } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { mergePDFs, downloadBlob } from "@/lib/pdf-utils";

const MergePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleMerge = async () => {
    if (files.length < 2) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(30);
      const mergedBlob = await mergePDFs(files);
      setProgress(80);
      
      downloadBlob(mergedBlob, "merged.pdf");
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Merge error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document"
      icon={Merge}
      color="merge"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            multiple
            maxFiles={20}
            title="Drop your PDF files here"
            description="Select multiple files to merge"
          />

          {files.length >= 2 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleMerge} className="px-8">
                Merge {files.length} PDFs
              </Button>
            </div>
          )}

          {files.length === 1 && (
            <p className="mt-4 text-center text-muted-foreground">
              Add at least one more PDF to merge
            </p>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message={
              status === "success"
                ? "Your merged PDF has been downloaded!"
                : "Combining your PDFs..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Merge More PDFs</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default MergePDF;
