import { useState } from "react";
import { Unlock } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";

const UnlockPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnlock = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      // Try to load PDF with password if provided
      const loadOptions: { password?: string } = {};
      if (password) {
        loadOptions.password = password;
      }

      const pdf = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        ...loadOptions,
      });

      setProgress(60);

      // Create a new PDF without encryption
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => newPdf.addPage(page));

      setProgress(80);
      const pdfBytes = await newPdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      await downloadBlob(blob, `${originalName}-unlocked.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error: any) {
      console.error("Unlock error:", error);
      if (error.message?.includes("password")) {
        setErrorMessage("Incorrect password. Please try again.");
      } else {
        setErrorMessage("Failed to unlock PDF. It may require a password.");
      }
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setPassword("");
    setErrorMessage("");
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove restrictions from PDF files"
      icon={Unlock}
      color="protect"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to unlock"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password (if protected)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PDF password (optional)"
                />
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleUnlock} className="px-8">
                  Unlock PDF
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message="Unlocking PDF..."
        />
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message="Your unlocked PDF has been downloaded!"
          />

          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Unlock Another PDF</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default UnlockPDF;
