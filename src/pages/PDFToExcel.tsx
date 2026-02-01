import { useState } from "react";
import { Sheet } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFToExcel = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const extractTextFromPDF = async (file: File): Promise<string[][]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allRows: string[][] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by their Y position to form rows
      const items = textContent.items as any[];
      const rowMap = new Map<number, { x: number; text: string }[]>();

      for (const item of items) {
        const y = Math.round(item.transform[5]); // Y position
        const x = Math.round(item.transform[4]); // X position
        
        if (!rowMap.has(y)) {
          rowMap.set(y, []);
        }
        rowMap.get(y)!.push({ x, text: item.str });
      }

      // Sort rows by Y (descending - PDF coordinates) and cells by X
      const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);
      
      for (const y of sortedYs) {
        const cells = rowMap.get(y)!;
        cells.sort((a, b) => a.x - b.x);
        
        // Combine cells that are close together
        const row: string[] = [];
        let currentCell = "";
        let lastX = -1000;

        for (const cell of cells) {
          if (cell.x - lastX > 50 && currentCell) {
            row.push(currentCell.trim());
            currentCell = cell.text;
          } else {
            currentCell += " " + cell.text;
          }
          lastX = cell.x + cell.text.length * 5;
        }
        
        if (currentCell.trim()) {
          row.push(currentCell.trim());
        }
        
        if (row.length > 0) {
          allRows.push(row);
        }
      }

      setProgress(20 + (pageNum / pdf.numPages) * 50);
    }

    return allRows;
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      setProgress(10);
      const rows = await extractTextFromPDF(files[0]);
      setProgress(70);

      if (rows.length === 0) {
        throw new Error("No text content found in PDF");
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      
      // Auto-size columns
      const colWidths = rows.reduce((widths: number[], row) => {
        row.forEach((cell, i) => {
          const len = String(cell).length;
          widths[i] = Math.max(widths[i] || 10, Math.min(len + 2, 50));
        });
        return widths;
      }, []);
      
      worksheet["!cols"] = colWidths.map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      setProgress(85);

      // Generate file
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });

      // Download
      const originalName = files[0].name.replace(".pdf", "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${originalName}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

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
      title="PDF to Excel"
      description="Convert PDF tables to Excel spreadsheets"
      icon={Sheet}
      color="compress"
    >
      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Client-side extraction:</strong> Extracts text and attempts to detect table structure. Works best with simple, text-based PDFs.
        </p>
      </div>

      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to Excel"
          />

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
              {errorMessage}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleConvert} className="px-8">
                Convert to Excel
              </Button>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Extracting data from PDF..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your Excel file has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Convert Another File</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToExcel;
