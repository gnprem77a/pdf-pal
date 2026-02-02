import { useState } from "react";
import { FileText, Construction } from "lucide-react";
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
        <Construction className="mx-auto mb-3 h-12 w-12 text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
          Server-Side Editing Coming Soon
        </h3>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          PDF editing requires server-side annotation rendering to ensure consistent output 
          across all platforms. This feature is being implemented.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          In the meantime, you can use our other tools like <strong>Watermark</strong>, 
          <strong> E-Sign</strong>, or <strong>Add Page Numbers</strong> to modify your PDFs.
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
              Open Editor
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default EditPDF;
