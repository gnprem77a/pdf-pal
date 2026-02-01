import { useState } from "react";
import { FileText, Copy, Download } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFToText = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");

  const handleExtract = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(20);

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setProgress(40);

      let fullText = "";
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        setProgress(40 + (i / totalPages) * 50);
      }

      setExtractedText(fullText);
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Extraction error:", error);
      setStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = files[0]?.name.replace(".pdf", ".txt") || "extracted-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setExtractedText("");
  };

  return (
    <ToolLayout
      title="PDF to Text"
      description="Extract text content from PDF files"
      icon={FileText}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to extract text"
          />

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleExtract} className="px-8">
                Extract Text
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message="Extracting text from PDF..."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Extracted Text</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download .txt
              </Button>
            </div>
          </div>

          <Textarea
            value={extractedText}
            readOnly
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex justify-center">
            <Button onClick={handleReset}>Extract Another PDF</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default PDFToText;
