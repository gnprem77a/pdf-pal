import { useState } from "react";
import { Code } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ProcessingStatus from "@/components/ProcessingStatus";
import { getApiUrl } from "@/lib/api-config";
import { triggerDownload } from "@/hooks/use-backend-pdf";
import { toast } from "sonner";

const HTMLToPDF = () => {
  const [htmlContent, setHtmlContent] = useState("<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (!htmlContent.trim()) return;

    setStatus("processing");
    setProgress(10);

    try {
      // Create a temporary HTML file to send to the backend
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const htmlFile = new File([htmlBlob], "content.html", { type: "text/html" });

      const formData = new FormData();
      formData.append("file0", htmlFile);
      formData.append("fileCount", "1");

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
      previewFile={null}
    >
      {status === "idle" || status === "error" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Enter your HTML content..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter HTML content to convert to PDF. You can include inline CSS styles.
            </p>
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleConvert} 
              className="px-8"
              disabled={!htmlContent.trim()}
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
