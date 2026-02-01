import { useState } from "react";
import { Presentation } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { downloadBlob } from "@/lib/pdf-utils";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

const PowerPointToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      setProgress(20);

      // PPTX is a ZIP file - extract slide content
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
          return numA - numB;
        });

      if (slideFiles.length === 0) {
        throw new Error("No slides found in PowerPoint file");
      }

      // Create PDF with landscape orientation (typical for slides)
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });

      for (let i = 0; i < slideFiles.length; i++) {
        if (i > 0) pdf.addPage([960, 540], "landscape");

        const slideXml = await zip.file(slideFiles[i])?.async("string");
        if (!slideXml) continue;

        // Extract text content from XML
        const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        const texts = textMatches.map(match => 
          match.replace(/<a:t>|<\/a:t>/g, "").trim()
        ).filter(t => t.length > 0);

        // Render slide background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 960, 540, "F");

        // Add slide number
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(`Slide ${i + 1}`, 900, 530);

        // Render text content
        pdf.setTextColor(0);
        let y = 60;

        if (texts.length === 0) {
          pdf.setFontSize(14);
          pdf.setTextColor(150);
          pdf.text("(Slide content could not be extracted)", 480, 270, { align: "center" });
        } else {
          // First text is usually the title
          if (texts[0]) {
            pdf.setFontSize(28);
            pdf.setFont("helvetica", "bold");
            pdf.text(texts[0], 480, y, { align: "center", maxWidth: 880 });
            y += 60;
          }

          // Remaining texts are body content
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "normal");
          for (let j = 1; j < texts.length; j++) {
            if (y > 480) break;
            const lines = pdf.splitTextToSize(texts[j], 800);
            pdf.text(lines, 80, y);
            y += lines.length * 22 + 10;
          }
        }

        setProgress(20 + (i / slideFiles.length) * 70);
      }

      setProgress(95);
      const pdfBlob = pdf.output("blob");
      
      const originalName = files[0].name.replace(/\.(ppt|pptx)$/i, "");
      await downloadBlob(pdfBlob, `${originalName}.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Conversion failed");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <ToolLayout
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF format"
      icon={Presentation}
      color="image"
    >
      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Client-side conversion:</strong> Extracts text content from slides. Images, shapes, charts, and formatting are not preserved.
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".ppt,.pptx"
            title="Drop your PowerPoint file here"
            description="Select a .ppt or .pptx file to convert"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to PDF
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Converting PowerPoint to PDF..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your PDF has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Convert Another File</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default PowerPointToPDF;
