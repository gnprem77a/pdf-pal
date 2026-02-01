import { useState } from "react";
import { Unlock } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const UnlockPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleUnlock = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles("unlockPdf", files, password ? { password } : undefined, `${baseName}-unlocked.pdf`);
  };

  const handleReset = () => { setFiles([]); setPassword(""); reset(); };

  return (
    <ToolLayout title="Unlock PDF" description="Remove restrictions from PDF files" icon={Unlock} color="protect">
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload files={files} onFilesChange={setFiles} title="Drop your PDF file here" description="Select a PDF to unlock" />
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password (if protected)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter PDF password (optional)" />
              </div>
              <div className="flex justify-center"><Button size="lg" onClick={handleUnlock} className="px-8">Unlock PDF</Button></div>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message={status === "success" ? "Unlocked PDF ready!" : "Unlocking..."} />
          {status === "success" && <div className="mt-6 flex justify-center"><Button onClick={handleReset}>Unlock Another PDF</Button></div>}
        </>
      )}
    </ToolLayout>
  );
};

export default UnlockPDF;
