import { useState } from "react";
import { Sheet } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const ExcelToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name).replace(/\.(xls|xlsx)$/i, "");
    await processFiles("excelToPdf", files, undefined, `${baseName}.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF format"
      icon={Sheet}
      color="compress"
      previewFile={null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".xls,.xlsx"
            title="Drop your Excel file here"
            description="Select a .xls or .xlsx file to convert"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PDF
              </Button>
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
                : "Uploading and converting..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another File</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ExcelToPDF;
