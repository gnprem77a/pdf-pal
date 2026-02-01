import { useState } from "react";
import { FileType } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { downloadBlob } from "@/lib/pdf-utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const PDFToWord = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(20);

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const paragraphs: Paragraph[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group text items by their vertical position (y coordinate)
        const lines: Map<number, string[]> = new Map();
        
        textContent.items.forEach((item: any) => {
          if (item.str) {
            const y = Math.round(item.transform[5]);
            if (!lines.has(y)) {
              lines.set(y, []);
            }
            lines.get(y)!.push(item.str);
          }
        });

        // Sort by Y position (descending since PDF coordinates start from bottom)
        const sortedLines = Array.from(lines.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([, texts]) => texts.join(" "));

        // Add page header
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `--- Page ${pageNum} ---`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 200 },
          })
        );

        // Add text paragraphs
        sortedLines.forEach((line) => {
          if (line.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text: line, size: 22 })],
                spacing: { after: 100 },
              })
            );
          }
        });

        setProgress(20 + (pageNum / totalPages) * 60);
      }

      setProgress(85);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const originalName = files[0].name.replace(".pdf", "");
      await downloadBlob(blob, `${originalName}.docx`);

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
      title="PDF to Word"
      description="Convert PDF files to editable Word documents"
      icon={FileType}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to Word"
          />

          <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> This extracts text content from your PDF. Complex formatting, 
            images, and tables may not be preserved exactly as in the original.
          </div>

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to Word
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
                ? "Your Word document has been downloaded!"
                : "Converting PDF to Word..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToWord;
