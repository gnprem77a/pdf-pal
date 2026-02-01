import { useState } from "react";
import { Code } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ProcessingStatus from "@/components/ProcessingStatus";
import { useBackendPdf } from "@/hooks/use-backend-pdf";
import { getApiUrl } from "@/lib/api-config";
import { triggerDownload } from "@/hooks/use-backend-pdf";
import { toast } from "sonner";

const HTMLToPDF = () => {
  const [htmlContent, setHtmlContent] = useState("<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    setStatus("processing");
    setProgress(10);

    try {
      const formData = new FormData();
      
      if (url.trim()) {
        formData.append("url", url);
      } else {
        formData.append("html", htmlContent);
      }

      setProgress(30);

      const response = await fetch(getApiUrl("htmlToPdf"), {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error("Conversion failed");
      }

      const result = await response.json();
      
      if (!result.downloadUrl) {
        throw new Error("No download URL returned");
      }

      setProgress(90);
      triggerDownload(result.downloadUrl, "converted-html.pdf");

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Conversion failed", {
        description: error instanceof Error ? error.message : "Please check your backend server",
      });
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ToolLayout
      title="HTML to PDF"
      description="Convert HTML content to PDF format"
      icon={Code}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">URL (optional)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to convert, or use the HTML editor below.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Enter your HTML content..."
              className="min-h-[200px] font-mono text-sm"
              disabled={!!url.trim()}
            />
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleConvert} 
              className="px-8"
              disabled={!htmlContent.trim() && !url.trim()}
            >
              Convert to PDF
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message={
              status === "success"
                ? "Your PDF is ready for download!"
                : "Converting HTML to PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert More HTML</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default HTMLToPDF;
