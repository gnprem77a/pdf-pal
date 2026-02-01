import { useState } from "react";
import { Scissors, Plus, X } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";
import { getPDFPageCount } from "@/lib/pdf-utils";

interface PageRange {
  id: string;
  start: string;
  end: string;
}

const SplitPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState<"all" | "range">("all");
  const [ranges, setRanges] = useState<PageRange[]>([
    { id: "1", start: "1", end: "" },
  ]);

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
      setRanges([{ id: "1", start: "1", end: String(count) }]);
    } else {
      setPageCount(0);
      setRanges([{ id: "1", start: "1", end: "" }]);
    }
  };

  const addRange = () => {
    setRanges((prev) => [
      ...prev,
      { id: String(Date.now()), start: "", end: "" },
    ]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateRange = (id: string, field: "start" | "end", value: string) => {
    setRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const parseRanges = (): { start: number; end: number }[] => {
    return ranges
      .map((r) => ({
        start: parseInt(r.start, 10) || 1,
        end: parseInt(r.end, 10) || pageCount,
      }))
      .filter((r) => r.start > 0 && r.end > 0 && r.start <= r.end && r.start <= pageCount);
  };

  const handleSplitAll = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "splitPdf",
      files,
      { mode: "individual" },
      `${baseName}-split.zip`
    );
  };

  const handleSplitByRange = async () => {
    if (files.length === 0) return;
    const parsedRanges = parseRanges();
    if (parsedRanges.length === 0) return;

    const baseName = getBaseName(files[0].name);
    const outputName = parsedRanges.length === 1
      ? `${baseName}-pages-${parsedRanges[0].start}-${parsedRanges[0].end}.pdf`
      : `${baseName}-split.zip`;

    await processFiles(
      "splitPdf",
      files,
      { ranges: JSON.stringify(parsedRanges) },
      outputName
    );
  };

  const handleReset = () => {
    setFiles([]);
    setPageCount(0);
    setRanges([{ id: "1", start: "1", end: "" }]);
    setSplitMode("all");
    reset();
  };

  const isValidRange = (r: PageRange) => {
    const start = parseInt(r.start, 10);
    const end = parseInt(r.end, 10);
    return start > 0 && end > 0 && start <= end && start <= pageCount && end <= pageCount;
  };

  const allRangesValid = ranges.every(isValidRange);

  return (
    <ToolLayout
      title="Split PDF"
      description="Separate PDF pages into individual files"
      icon={Scissors}
      color="split"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to split"
          />

          {files.length > 0 && pageCount > 0 && (
            <div className="mt-6">
              <div className="mb-4 text-center">
                <p className="text-lg font-medium text-foreground">
                  {pageCount} pages detected
                </p>
              </div>

              <Tabs
                value={splitMode}
                onValueChange={(v) => setSplitMode(v as "all" | "range")}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    Extract All Pages
                  </TabsTrigger>
                  <TabsTrigger value="range" className="flex-1">
                    Custom Range
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <p className="mb-4 text-center text-muted-foreground">
                    Each page will be saved as a separate PDF file
                  </p>
                  <div className="flex justify-center">
                    <Button size="lg" onClick={handleSplitAll} className="px-8">
                      Split into {pageCount} PDFs
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="range" className="mt-4 space-y-4">
                  <p className="text-center text-muted-foreground">
                    Specify page ranges to extract (e.g., 1-5, 8-12)
                  </p>

                  <div className="space-y-3">
                    {ranges.map((range, index) => (
                      <div
                        key={range.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <span className="text-sm font-medium text-muted-foreground w-16">
                          Range {index + 1}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <Label htmlFor={`start-${range.id}`} className="sr-only">
                              Start page
                            </Label>
                            <Input
                              id={`start-${range.id}`}
                              type="number"
                              min="1"
                              max={pageCount}
                              placeholder="Start"
                              value={range.start}
                              onChange={(e) =>
                                updateRange(range.id, "start", e.target.value)
                              }
                              className="text-center"
                            />
                          </div>

                          <span className="text-muted-foreground">to</span>

                          <div className="flex-1">
                            <Label htmlFor={`end-${range.id}`} className="sr-only">
                              End page
                            </Label>
                            <Input
                              id={`end-${range.id}`}
                              type="number"
                              min="1"
                              max={pageCount}
                              placeholder="End"
                              value={range.end}
                              onChange={(e) =>
                                updateRange(range.id, "end", e.target.value)
                              }
                              className="text-center"
                            />
                          </div>
                        </div>

                        {ranges.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRange(range.id)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={addRange}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Range
                    </Button>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      onClick={handleSplitByRange}
                      disabled={!allRangesValid}
                      className="px-8"
                    >
                      Split {ranges.length} Range{ranges.length > 1 ? "s" : ""}
                    </Button>
                  </div>

                  {!allRangesValid && ranges.some((r) => r.start || r.end) && (
                    <p className="text-center text-sm text-destructive">
                      Please enter valid page ranges (1-{pageCount})
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      ) : (
        <>
          <ProcessingStatus
            status={status}
            progress={progress}
            message={
              status === "success"
                ? "Your split PDFs are ready for download!"
                : "Uploading and splitting your PDF..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Split Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default SplitPDF;
