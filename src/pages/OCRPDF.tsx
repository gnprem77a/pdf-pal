import { useState } from "react";
import { FileSearch, Copy, Download } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const OCRPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [language, setLanguage] = useState("eng");

  const languages = [
    { code: "eng", name: "English" },
    { code: "spa", name: "Spanish" },
    { code: "fra", name: "French" },
    { code: "deu", name: "German" },
    { code: "ita", name: "Italian" },
    { code: "por", name: "Portuguese" },
    { code: "rus", name: "Russian" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "ara", name: "Arabic" },
    { code: "hin", name: "Hindi" },
  ];

  const handleOCR = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setProgressMessage("Loading PDF...");
    setExtractedText("");

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let fullText = "";

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgressMessage(`Rendering page ${pageNum} of ${totalPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        setProgressMessage(`Running OCR on page ${pageNum}...`);
        
        const result = await Tesseract.recognize(canvas, language, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const pageProgress = (pageNum - 1) / totalPages;
              const withinPageProgress = m.progress / totalPages;
              setProgress((pageProgress + withinPageProgress) * 100);
            }
          },
        });

        fullText += `--- Page ${pageNum} ---\n${result.data.text}\n\n`;
      }

      setExtractedText(fullText);
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("OCR error:", error);
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
    a.download = files[0]?.name.replace(".pdf", "-ocr.txt") || "ocr-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setProgressMessage("");
    setExtractedText("");
  };

  return (
    <ToolLayout
      title="OCR PDF"
      description="Extract text from scanned PDFs using optical character recognition"
      icon={FileSearch}
      color="compress"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your scanned PDF here"
            description="Select a PDF with scanned pages"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Recognition Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> OCR runs entirely in your browser. Large PDFs may take 
                several minutes. For best results, ensure your scanned document is clear and 
                high-resolution.
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleOCR} className="px-8">
                  Start OCR
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message={progressMessage}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Extracted Text (OCR)</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <Textarea
            value={extractedText}
            readOnly
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex justify-center">
            <Button onClick={handleReset}>OCR Another PDF</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default OCRPDF;
