import { useState } from "react";
import { Code } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ProcessingStatus from "@/components/ProcessingStatus";
import { jsPDF } from "jspdf";
import { downloadBlob } from "@/lib/pdf-utils";

const HTMLToPDF = () => {
  const [htmlContent, setHtmlContent] = useState("<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    setStatus("processing");
    setProgress(0);

    try {
      setProgress(30);
      
      // Create a temporary div to render HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = "595px"; // A4 width in points
      tempDiv.style.padding = "40px";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      document.body.appendChild(tempDiv);

      setProgress(50);
      
      const doc = new jsPDF("p", "pt", "a4");
      
      // Simple text extraction and formatting
      const text = tempDiv.innerText;
      const lines = doc.splitTextToSize(text, 515);
      
      let y = 40;
      const lineHeight = 16;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      for (const line of lines) {
        if (y + lineHeight > pageHeight - 40) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, 40, y);
        y += lineHeight;
      }

      document.body.removeChild(tempDiv);

      setProgress(80);
      
      const pdfBlob = doc.output("blob");
      downloadBlob(pdfBlob, "converted-html.pdf");

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
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
              disabled
            />
            <p className="text-xs text-muted-foreground">
              URL conversion requires backend support. Use HTML input below instead.
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
            />
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
                ? "Your PDF has been downloaded!"
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
