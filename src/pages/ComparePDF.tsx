import { useState } from "react";
import { GitCompare, FileText, ArrowRight } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { useBackendPdf } from "@/hooks/use-backend-pdf";

const ComparePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleCompare = async () => {
    if (files.length < 2) return;
    await processFiles("comparePdf", files, undefined, "comparison.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Compare PDF"
      description="Compare two PDF documents and highlight differences"
      icon={GitCompare}
      color="word"
      previewFile={files.length > 0 ? files[0] : null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            multiple
            maxFiles={2}
            title="Drop two PDF files here"
            description="Select exactly 2 PDFs to compare"
          />

          {files.length === 2 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{files[0].name}</span>
                </div>
                <ArrowRight className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{files[1].name}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleCompare} className="px-8">
                  Compare PDFs
                </Button>
              </div>
            </div>
          )}

          {files.length > 0 && files.length !== 2 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Please select exactly 2 PDF files to compare
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
                ? "Your comparison PDF is ready for download!"
                : "Comparing PDFs and generating difference report..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Compare Other PDFs</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ComparePDF;
