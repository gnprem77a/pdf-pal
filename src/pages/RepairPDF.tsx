import { useState } from "react";
import { Wrench } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const RepairPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleRepair = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("repairPdf", files, undefined, `${baseName}-repaired.pdf`);
  };

  const handleReset = () => { setFiles([]); reset(); };

  return (
    <ToolLayout title="Repair PDF" description="Fix corrupted or damaged PDF files" icon={Wrench} color="compress" previewFile={files.length > 0 ? files[0] : null}>
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload files={files} onFilesChange={setFiles} title="Drop your corrupted PDF here" description="Select a PDF file that needs repair" />
          {files.length > 0 && <div className="mt-6 flex justify-center"><Button size="lg" onClick={handleRepair} className="px-8"><Wrench className="mr-2 h-5 w-5" />Repair PDF</Button></div>}
        </>
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message={status === "success" ? "Repaired PDF ready!" : "Repairing..."} />
          {status === "success" && <div className="mt-6 flex justify-center"><Button onClick={handleReset}>Repair Another PDF</Button></div>}
        </>
      )}
    </ToolLayout>
  );
};

export default RepairPDF;
