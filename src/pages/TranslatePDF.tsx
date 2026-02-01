import { useState } from "react";
import { Languages, Copy, Download } from "lucide-react";
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
import APIKeySettings, { useOpenAIKey } from "@/components/APIKeySettings";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const TranslatePDF = () => {
  const { apiKey, hasApiKey } = useOpenAIKey();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [translation, setTranslation] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");

  const languages = [
    "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
    "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Dutch",
    "Polish", "Swedish", "Turkish", "Vietnamese", "Thai", "Indonesian"
  ];

  const extractText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text;
  };

  const handleTranslate = async () => {
    if (files.length === 0 || !apiKey) return;

    setStatus("processing");
    setProgress(0);
    setTranslation("");

    try {
      setProgress(20);
      const text = await extractText(files[0]);
      
      // Truncate if too long
      const maxChars = 8000;
      const truncatedText = text.length > maxChars 
        ? text.slice(0, maxChars) + "...[truncated]" 
        : text;

      setProgress(40);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original formatting as much as possible.`,
            },
            {
              role: "user",
              content: truncatedText,
            },
          ],
          max_tokens: 3000,
        }),
      });

      setProgress(80);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API request failed");
      }

      const data = await response.json();
      setTranslation(data.choices[0]?.message?.content || "Translation failed");

      setProgress(100);
      setStatus("success");
    } catch (error: any) {
      console.error("Translation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to translate document",
        variant: "destructive",
      });
      setStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    toast({ title: "Copied!", description: "Translation copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([translation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translated-${targetLanguage.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setTranslation("");
  };

  return (
    <ToolLayout
      title="Translate PDF"
      description="Translate your PDF documents to different languages"
      icon={Languages}
      color="compress"
    >
      {!hasApiKey ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Languages className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">OpenAI API Key Required</h3>
          <p className="mb-4 text-muted-foreground">
            To use AI translation, please add your OpenAI API key.
          </p>
          <APIKeySettings />
        </div>
      ) : status === "idle" || status === "error" ? (
        <>
          <div className="mb-4 flex justify-end">
            <APIKeySettings />
          </div>

          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to translate"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleTranslate} className="px-8">
                  <Languages className="mr-2 h-4 w-4" />
                  Translate to {targetLanguage}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message="Translating document..."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Translation ({targetLanguage})
            </h3>
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
            value={translation}
            readOnly
            className="min-h-[400px]"
          />

          <div className="flex justify-center">
            <Button onClick={handleReset}>Translate Another PDF</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default TranslatePDF;
