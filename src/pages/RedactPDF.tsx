import { EyeOff } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

const RedactPDF = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="Redact PDF"
      description="Permanently remove sensitive information from PDF documents"
      icon={EyeOff}
      color="protect"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Coming Soon:</strong> PDF redaction requires a visual editor for selecting areas to redact.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          This feature will allow you to permanently black out text and images from your PDF.
        </p>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          title="Drop your PDF file here"
          description="Select a PDF to redact"
        />
      </div>
    </ToolLayout>
  );
};

export default RedactPDF;
