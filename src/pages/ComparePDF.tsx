import { useState, useEffect } from "react";
import { GitCompare, FileText, ArrowRight } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import ProcessingStatus from "@/components/ProcessingStatus";
import * as pdfjsLib from "pdfjs-dist";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DiffResult {
  type: "added" | "removed" | "unchanged";
  text: string;
}

const ComparePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [file1Text, setFile1Text] = useState("");
  const [file2Text, setFile2Text] = useState("");

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  };

  const computeDiff = (text1: string, text2: string): DiffResult[] => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const results: DiffResult[] = [];

    // Simple word-by-word diff
    const maxLen = Math.max(words1.length, words2.length);
    let i = 0, j = 0;

    while (i < words1.length || j < words2.length) {
      if (i >= words1.length) {
        results.push({ type: "added", text: words2[j] });
        j++;
      } else if (j >= words2.length) {
        results.push({ type: "removed", text: words1[i] });
        i++;
      } else if (words1[i] === words2[j]) {
        results.push({ type: "unchanged", text: words1[i] });
        i++;
        j++;
      } else {
        // Look ahead to find matches
        let foundIn2 = words2.slice(j, j + 10).indexOf(words1[i]);
        let foundIn1 = words1.slice(i, i + 10).indexOf(words2[j]);

        if (foundIn2 !== -1 && (foundIn1 === -1 || foundIn2 <= foundIn1)) {
          // Words were added in file 2
          for (let k = 0; k < foundIn2; k++) {
            results.push({ type: "added", text: words2[j + k] });
          }
          j += foundIn2;
        } else if (foundIn1 !== -1) {
          // Words were removed from file 1
          for (let k = 0; k < foundIn1; k++) {
            results.push({ type: "removed", text: words1[i + k] });
          }
          i += foundIn1;
        } else {
          results.push({ type: "removed", text: words1[i] });
          results.push({ type: "added", text: words2[j] });
          i++;
          j++;
        }
      }
    }

    return results;
  };

  const handleCompare = async () => {
    if (files.length < 2) return;

    setStatus("processing");
    setProgress(0);

    try {
      setProgress(20);
      const text1 = await extractTextFromPDF(files[0]);
      setFile1Text(text1);
      
      setProgress(50);
      const text2 = await extractTextFromPDF(files[1]);
      setFile2Text(text2);

      setProgress(80);
      const diff = computeDiff(text1, text2);
      setDiffResults(diff);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Comparison error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setDiffResults([]);
    setFile1Text("");
    setFile2Text("");
  };

  const addedCount = diffResults.filter((d) => d.type === "added").length;
  const removedCount = diffResults.filter((d) => d.type === "removed").length;

  return (
    <ToolLayout
      title="Compare PDF"
      description="Compare two PDF documents and highlight differences"
      icon={GitCompare}
      color="word"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            multiple
            maxFiles={2}
            title="Drop two PDF files here"
            description="Select exactly 2 PDFs to compare"
          />

          {files.length === 2 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{files[0].name}</span>
                </div>
                <ArrowRight className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{files[1].name}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleCompare} className="px-8">
                  Compare PDFs
                </Button>
              </div>
            </div>
          )}

          {files.length > 0 && files.length !== 2 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Please select exactly 2 PDF files to compare
            </p>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Extracting and comparing text..." />
      ) : (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">Comparison Results</h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">+{addedCount} added</span>
                <span className="text-red-600">-{removedCount} removed</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-auto rounded border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap leading-relaxed">
                {diffResults.map((result, index) => (
                  <span
                    key={index}
                    className={
                      result.type === "added"
                        ? "bg-green-200 dark:bg-green-900/50"
                        : result.type === "removed"
                        ? "bg-red-200 line-through dark:bg-red-900/50"
                        : ""
                    }
                  >
                    {result.text}{" "}
                  </span>
                ))}
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  {files[0]?.name} (Original)
                </h4>
                <div className="max-h-[200px] overflow-auto rounded border bg-background p-3 text-sm">
                  {file1Text.substring(0, 1000)}
                  {file1Text.length > 1000 && "..."}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  {files[1]?.name} (Modified)
                </h4>
                <div className="max-h-[200px] overflow-auto rounded border bg-background p-3 text-sm">
                  {file2Text.substring(0, 1000)}
                  {file2Text.length > 1000 && "..."}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Compare Other PDFs</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default ComparePDF;
