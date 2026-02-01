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
import { useBackendPdf, getBaseName, triggerDownload } from "@/hooks/use-backend-pdf";
import { getApiUrl } from "@/lib/api-config";

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
    setProgress(10);
    setProgressMessage("Uploading PDF for OCR processing...");
    setExtractedText("");

    try {
      const formData = new FormData();
      formData.append("file0", files[0]);
      formData.append("fileCount", "1");
      formData.append("language", language);

      setProgress(30);
      setProgressMessage("Processing OCR on server...");

      const response = await fetch(getApiUrl("ocrPdf"), {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error("OCR processing failed");
      }

      const result = await response.json();
      
      if (result.text) {
        setExtractedText(result.text);
      }

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

  const handleDownload = async () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const filename = files[0]?.name.replace(".pdf", "-ocr.txt") || "ocr-text.txt";
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
