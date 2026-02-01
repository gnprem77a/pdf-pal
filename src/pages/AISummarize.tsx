import { useState } from "react";
import { Sparkles, Copy, Download } from "lucide-react";
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

type SummaryLength = "short" | "medium" | "detailed";

const AISummarize = () => {
  const { apiKey, hasApiKey } = useOpenAIKey();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState("");
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");

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

  const handleSummarize = async () => {
    if (files.length === 0 || !apiKey) return;

    setStatus("processing");
    setProgress(0);
    setSummary("");

    try {
      setProgress(20);
      const text = await extractText(files[0]);
      
      // Truncate if too long (OpenAI has token limits)
      const maxChars = 12000;
      const truncatedText = text.length > maxChars 
        ? text.slice(0, maxChars) + "...[truncated]" 
        : text;

      setProgress(40);

      const lengthInstructions = {
        short: "Provide a brief 2-3 sentence summary.",
        medium: "Provide a comprehensive summary in about 5-7 sentences covering the main points.",
        detailed: "Provide a detailed summary with key points, main arguments, and important details. Use bullet points where appropriate.",
      };

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
              content: "You are a helpful assistant that summarizes documents clearly and accurately.",
            },
            {
              role: "user",
              content: `Please summarize the following document. ${lengthInstructions[summaryLength]}\n\n${truncatedText}`,
            },
          ],
          max_tokens: 1000,
        }),
      });

      setProgress(80);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API request failed");
      }

      const data = await response.json();
      setSummary(data.choices[0]?.message?.content || "No summary generated");

      setProgress(100);
      setStatus("success");
    } catch (error: any) {
      console.error("Summarization error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to summarize document",
        variant: "destructive",
      });
      setStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast({ title: "Copied!", description: "Summary copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setSummary("");
  };

  return (
    <ToolLayout
      title="AI Summarize"
      description="Generate AI-powered summaries of your PDF documents"
      icon={Sparkles}
      color="word"
    >
      {!hasApiKey ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">OpenAI API Key Required</h3>
          <p className="mb-4 text-muted-foreground">
            To use AI features, please add your OpenAI API key. Your key is stored
            locally and never sent to our servers.
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
            description="Select a PDF to summarize"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Summary Length</Label>
                <Select
                  value={summaryLength}
                  onValueChange={(v) => setSummaryLength(v as SummaryLength)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (2-3 sentences)</SelectItem>
                    <SelectItem value="medium">Medium (5-7 sentences)</SelectItem>
                    <SelectItem value="detailed">Detailed (with bullet points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleSummarize} className="px-8">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message="Analyzing document with AI..."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">AI Summary</h3>
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

          <div className="rounded-lg border bg-card p-4">
            <p className="whitespace-pre-wrap text-foreground">{summary}</p>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleReset}>Summarize Another PDF</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default AISummarize;
