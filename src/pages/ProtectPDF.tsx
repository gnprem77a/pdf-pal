import { useState, useEffect } from "react";
import { Lock, AlertCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProcessingStatus from "@/components/ProcessingStatus";
import { protectPdf, checkBackendHealth } from "@/lib/api-service";
import { downloadBlob } from "@/lib/pdf-utils";
import { API_CONFIG } from "@/lib/api-config";

const ProtectPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendConnected);
  }, []);

  const handleProtect = async () => {
    if (files.length === 0) return;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters");
      return;
    }

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      setProgress(30);
      const result = await protectPdf(files[0], password);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Protection failed");
      }

      setProgress(80);
      const originalName = files[0].name.replace(".pdf", "");
      downloadBlob(result.data, `${originalName}-protected.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Protection error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Protection failed");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPassword("");
    setConfirmPassword("");
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF files"
      icon={Lock}
      color="protect"
    >
      {/* Backend status banner */}
      <div className={`mb-4 rounded-lg border p-4 ${
        backendConnected === false 
          ? "border-yellow-500/30 bg-yellow-500/10" 
          : backendConnected === true 
          ? "border-green-500/30 bg-green-500/10"
          : "border-muted bg-muted/50"
      }`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`mt-0.5 h-5 w-5 ${
            backendConnected === false 
              ? "text-yellow-600" 
              : backendConnected === true 
              ? "text-green-600"
              : "text-muted-foreground"
          }`} />
          <div className="text-sm">
            {backendConnected === null && (
              <p className="text-muted-foreground">Checking backend connection...</p>
            )}
            {backendConnected === false && (
              <>
                <p className="font-medium text-yellow-700 dark:text-yellow-300">
                  Backend not connected
                </p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  Your Go backend at <code className="rounded bg-yellow-200/50 px-1">{API_CONFIG.baseUrl}</code> is not responding.
                </p>
                <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                  PDF encryption requires server-side processing. Set <code className="rounded bg-yellow-200/50 px-1">VITE_API_URL</code> to your API URL.
                </p>
              </>
            )}
            {backendConnected === true && (
              <p className="text-green-700 dark:text-green-300">
                ✓ Connected to backend at <code className="rounded bg-green-200/50 px-1">{API_CONFIG.baseUrl}</code>
              </p>
            )}
          </div>
        </div>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to protect with a password"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="mx-auto max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className={confirmPassword && !passwordsMatch ? "border-destructive" : ""}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleProtect} 
                  className="px-8"
                  disabled={backendConnected === false || !passwordsMatch}
                >
                  <Lock className="mr-2 h-5 w-5" />
                  Protect PDF
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Encrypting PDF..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your protected PDF has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Protect Another PDF</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default ProtectPDF;
