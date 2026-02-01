import { GitCompare } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

const ComparePDF = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="Compare PDF"
      description="Compare two PDF documents and highlight differences"
      icon={GitCompare}
      color="word"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Coming Soon:</strong> PDF comparison requires advanced text extraction and diff algorithms.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          This feature will allow you to compare two PDF versions side-by-side.
        </p>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          multiple
          title="Drop two PDF files here"
          description="Select two PDFs to compare"
        />
      </div>
    </ToolLayout>
  );
};

export default ComparePDF;
