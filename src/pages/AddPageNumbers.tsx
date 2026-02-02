import { useState } from "react";
import { Hash } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

type Position = "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";

const AddPageNumbers = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<Position>("bottom-center");

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleAddNumbers = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "addPageNumbers",
      files,
      { position },
      `${baseName}-numbered.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Insert page numbers to your PDF"
      icon={Hash}
      color="merge"
      previewFile={files.length > 0 ? files[0] : null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to add page numbers"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Position</Label>
                <RadioGroup
                  value={position}
                  onValueChange={(v) => setPosition(v as Position)}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { value: "top-left", label: "Top Left" },
                    { value: "top-center", label: "Top Center" },
                    { value: "top-right", label: "Top Right" },
                    { value: "bottom-left", label: "Bottom Left" },
                    { value: "bottom-center", label: "Bottom Center" },
                    { value: "bottom-right", label: "Bottom Right" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-sm cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleAddNumbers} className="px-8">
                  Add Page Numbers
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
                : "Adding page numbers..."
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

export default AddPageNumbers;
