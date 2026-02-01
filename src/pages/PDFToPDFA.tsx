import { useState } from "react";
import { FileCheck, AlertCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";

const PDFToPDFA = () => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolLayout
      title="PDF to PDF/A"
      description="Convert PDF to archival format (PDF/A) for long-term preservation"
      icon={FileCheck}
      color="protect"
    >
      <div className="mb-4 rounded-lg border bg-muted/30 p-4">
        <h3 className="font-medium">What is PDF/A?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF/A is an ISO-standardized version of PDF designed for long-term digital preservation. 
          It embeds all fonts, disables encryption, and ensures the document can be viewed 
          consistently in the future.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-yellow-600" />
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Backend Required:</strong> PDF/A conversion cannot be done client-side.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          PDF/A requires font embedding, color profile conversion, and metadata validation that browsers can't perform.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Use <code className="rounded bg-yellow-200/50 px-1">Ghostscript</code> in your Go backend:
        </p>
        <pre className="mt-2 rounded bg-yellow-200/30 p-2 text-left text-xs">
{`gs -dPDFA -dBATCH -dNOPAUSE \\
   -sDEVICE=pdfwrite \\
   -sOutputFile=output.pdf \\
   input.pdf`}
        </pre>
      </div>

      <div className="mt-6 opacity-50 pointer-events-none">
        <FileUpload
          files={files}
          onFilesChange={setFiles}
          title="Drop your PDF file here"
          description="Select a PDF to convert to PDF/A"
        />

        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="px-8" disabled>
              Convert to PDF/A
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default PDFToPDFA;
