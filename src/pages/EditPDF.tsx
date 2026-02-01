import { useState } from "react";
import { FileText } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";

const EditPDF = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text, shapes, and annotations to PDF files"
      icon={FileText}
      color="word"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Coming Soon:</strong> Full PDF editing with text, shapes, and
          annotations is in development.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Check back soon for this feature.
        </p>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          title="Drop your PDF file here"
          description="Select a PDF to edit"
        />

        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="px-8" disabled>
              Edit PDF
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default EditPDF;
