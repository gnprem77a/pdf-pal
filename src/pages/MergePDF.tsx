import { useState } from "react";
import { Merge } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf } from "@/hooks/use-backend-pdf";

const MergePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleMerge = async () => {
    if (files.length < 2) return;
    await processFiles("mergePdf", files, undefined, "merged.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    reset();
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
                ? "Your merged PDF is ready for download!"
                : "Uploading and merging your PDFs..."
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
