import { useState } from "react";
import { Lock } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

const ProtectPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleProtect = async () => {
    if (files.length === 0 || !password.trim()) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "protectPdf",
      files,
      { password },
      `${baseName}-protected.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setPassword("");
    reset();
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF files"
      icon={Lock}
      color="protect"
      previewFile={files.length > 0 ? files[0] : null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to protect"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password for protection"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleProtect}
                  className="px-8"
                  disabled={!password.trim()}
                >
                  Protect PDF
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
                ? "Your protected PDF is ready for download!"
                : "Encrypting your PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Protect Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default ProtectPDF;
