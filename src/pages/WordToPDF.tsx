import { useState } from "react";
import { FileType } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/pdf-utils";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";

const WordToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(20);
      const arrayBuffer = await files[0].arrayBuffer();
      
      setProgress(40);
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      setProgress(60);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      
      const lines = doc.splitTextToSize(result.value, maxWidth);
      let y = margin;
      const lineHeight = 7;

      for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }

      setProgress(80);
      const pdfBlob = doc.output("blob");
      
      const originalName = files[0].name.replace(/\.(docx?|doc)$/i, "");
      downloadBlob(pdfBlob, `${originalName}.pdf`);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word documents to PDF format"
      icon={FileType}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".doc,.docx"
            title="Drop your Word file here"
            description="Select a .doc or .docx file to convert"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PDF
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message={
              status === "success"
                ? "Your PDF has been downloaded!"
                : "Converting to PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another File</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default WordToPDF;
