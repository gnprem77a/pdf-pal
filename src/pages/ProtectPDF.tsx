import { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProtectPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF files"
      icon={Lock}
      color="protect"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-yellow-600" />
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Backend Required:</strong> PDF encryption cannot be done client-side.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          This tool requires your Go backend to be running. JavaScript browsers don't have access to PDF encryption algorithms.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Use <code className="rounded bg-yellow-200/50 px-1">qpdf</code> or <code className="rounded bg-yellow-200/50 px-1">unipdf</code> in your Go backend.
        </p>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
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
                placeholder="Enter password"
              />
            </div>

            <div className="flex justify-center">
              <Button size="lg" className="px-8" disabled>
                Protect PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ProtectPDF;
