import { useState } from "react";
import { Scissors } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { splitPDFToPages, downloadAsZip, getPDFPageCount } from "@/lib/pdf-utils";

const SplitPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
    } else {
      setPageCount(0);
    }
  };

  const handleSplitAll = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(30);
      const splitBlobs = await splitPDFToPages(files[0]);
      setProgress(80);

      const filenames = splitBlobs.map((_, i) => `page-${i + 1}.pdf`);
      await downloadAsZip(splitBlobs, filenames);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Split error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setPageCount(0);
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Separate PDF pages into individual files"
      icon={Scissors}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to split"
          />

          {files.length > 0 && pageCount > 0 && (
            <div className="mt-6">
              <div className="mb-4 text-center">
                <p className="text-lg font-medium text-foreground">
                  {pageCount} pages detected
                </p>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    Extract All Pages
                  </TabsTrigger>
                  <TabsTrigger value="range" className="flex-1" disabled>
                    Custom Range (Coming Soon)
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <p className="mb-4 text-center text-muted-foreground">
                    Each page will be saved as a separate PDF file
                  </p>
                  <div className="flex justify-center">
                    <Button size="lg" onClick={handleSplitAll} className="px-8">
                      Split into {pageCount} PDFs
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
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
                ? "Your split PDFs have been downloaded as a ZIP file!"
                : "Splitting your PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Split Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default SplitPDF;
