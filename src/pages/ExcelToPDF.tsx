import { Sheet } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

const ExcelToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF format"
      icon={Sheet}
      color="compress"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> Excel to PDF conversion requires server-side processing
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
          accept=".xls,.xlsx"
          title="Drop your Excel file here"
          description="Select a .xls or .xlsx file to convert"
        />
      </div>
    </ToolLayout>
  );
};

export default ExcelToPDF;
