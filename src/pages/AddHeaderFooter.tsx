import { useState } from "react";
import { AlignVerticalSpaceAround } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const AddHeaderFooter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleAdd = async () => {
    if (files.length === 0 || (!header && !footer)) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "addHeaderFooter",
      files,
      { header, footer },
      `${baseName}-headers.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setHeader("");
    setFooter("");
    reset();
  };

  return (
    <ToolLayout
      title="Add Header & Footer"
      description="Insert custom headers and footers to your PDF"
      icon={AlignVerticalSpaceAround}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to add headers/footers"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header">Header Text</Label>
                <Input
                  id="header"
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="Text to appear at the top of each page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer">Footer Text</Label>
                <Input
                  id="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Text to appear at the bottom of each page"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleAdd}
                  className="px-8"
                  disabled={!header && !footer}
                >
                  Add Header & Footer
                </Button>
              </div>
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
                ? "Your PDF is ready for download!"
                : "Adding headers and footers..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Process Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default AddHeaderFooter;
