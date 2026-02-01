import { useState } from "react";
import { Sheet } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import { downloadBlob } from "@/lib/pdf-utils";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const ExcelToPDF = () => {
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
      setProgress(20);

      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      setProgress(40);

      const pdf = new jsPDF();
      let isFirstPage = true;

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        if (data.length === 0) continue;

        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Add sheet name as title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(sheetName, 14, 15);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");

        let y = 25;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 14;
        const maxWidth = pageWidth - margin * 2;

        // Calculate column widths based on content
        const colCount = Math.max(...data.map(row => (row as any[]).length));
        const colWidth = Math.min(maxWidth / colCount, 40);

        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
          const row = data[rowIndex] as any[];
          
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = 15;
          }

          let x = margin;
          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const cell = row[colIndex];
            if (cell !== undefined && cell !== null) {
              const text = String(cell).substring(0, 20); // Truncate long text
              
              // Draw cell border
              pdf.rect(x, y - 4, colWidth, 8);
              
              // Draw text
              pdf.text(text, x + 1, y);
            } else {
              pdf.rect(x, y - 4, colWidth, 8);
            }
            x += colWidth;
            
            if (x > maxWidth) break;
          }
          y += 8;
        }

        setProgress(40 + (workbook.SheetNames.indexOf(sheetName) / workbook.SheetNames.length) * 40);
      }

      setProgress(90);
      const pdfBlob = pdf.output("blob");
      
      const originalName = files[0].name.replace(/\.(xls|xlsx)$/i, "");
      downloadBlob(pdfBlob, `${originalName}.pdf`);

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
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF format"
      icon={Sheet}
      color="compress"
    >
      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Client-side conversion:</strong> Basic table rendering. Complex formatting, charts, and formulas won't be preserved.
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".xls,.xlsx"
            title="Drop your Excel file here"
            description="Select a .xls or .xlsx file to convert"
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
        <ProcessingStatus status={status} progress={progress} message="Converting Excel to PDF..." />
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

export default ExcelToPDF;
