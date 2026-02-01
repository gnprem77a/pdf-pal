import { useState } from "react";
import { Info } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const PDFMetadata = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    title: "", author: "", subject: "", keywords: "", creator: "", producer: "",
  });

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleSave = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("pdfMetadata", files, metadata, `${baseName}-metadata.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    setMetadata({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
    reset();
  };

  return (
    <ToolLayout title="PDF Metadata" description="Edit PDF document properties" icon={Info} color="compress">
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload files={files} onFilesChange={setFiles} title="Drop your PDF file here" description="Select a PDF to edit metadata" />
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {["title", "author", "subject", "keywords", "creator", "producer"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                    <Input id={field} value={(metadata as any)[field]} onChange={(e) => setMetadata({ ...metadata, [field]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button size="lg" onClick={handleSave} className="px-8">Save Metadata</Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message={status === "success" ? "Your PDF is ready!" : "Updating..."} />
          {status === "success" && <div className="mt-6 flex justify-center"><Button onClick={handleReset}>Edit Another PDF</Button></div>}
        </>
      )}
    </ToolLayout>
  );
};

export default PDFMetadata;
