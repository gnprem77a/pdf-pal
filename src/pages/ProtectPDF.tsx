import { useState } from "react";
import { Lock } from "lucide-react";
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
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> PDF password protection requires server-side processing
          and is not available in the client-side version.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Enable Lovable Cloud for this feature.
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
