import { useState } from "react";
import { FileType } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";

const PDFToWord = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF files to editable Word documents"
      icon={FileType}
      color="word"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> PDF to Word conversion with formatting requires
          advanced OCR and server-side processing.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Enable Lovable Cloud for full conversion capabilities.
        </p>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          title="Drop your PDF file here"
          description="Select a PDF to convert"
        />

        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="px-8" disabled>
              Convert to Word
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default PDFToWord;
