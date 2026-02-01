import { Presentation } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

const PowerPointToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF format"
      icon={Presentation}
      color="image"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> PowerPoint to PDF conversion requires server-side processing
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
          accept=".ppt,.pptx"
          title="Drop your PowerPoint file here"
          description="Select a .ppt or .pptx file to convert"
        />
      </div>
    </ToolLayout>
  );
};

export default PowerPointToPDF;
