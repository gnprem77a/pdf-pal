import { useState, useRef } from "react";
import { EyeOff, Trash2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

interface RedactionArea {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const RedactPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [areas, setAreas] = useState<RedactionArea[]>([
    { id: "1", page: 1, x: 100, y: 100, width: 200, height: 50 }
  ]);
  const { status, progress, processFiles, reset } = useBackendPdf();

  const addArea = () => {
    setAreas(prev => [
      ...prev,
      { id: String(Date.now()), page: 1, x: 100, y: 100, width: 200, height: 50 }
    ]);
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      setAreas(prev => prev.filter(a => a.id !== id));
    }
  };

  const updateArea = (id: string, field: keyof RedactionArea, value: number) => {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRedact = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "redactPdf",
      files,
      { areas: JSON.stringify(areas.map(({ id, ...rest }) => rest)) },
      `${baseName}-redacted.pdf`
    );
  };

  const handleReset = () => {
    setFiles([]);
    setAreas([{ id: "1", page: 1, x: 100, y: 100, width: 200, height: 50 }]);
    reset();
  };

  return (
    <ToolLayout
      title="Redact PDF"
      description="Permanently remove sensitive information from PDF documents"
      icon={EyeOff}
      color="protect"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to redact"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">Redaction Areas</Label>
                <p className="text-sm text-muted-foreground">
                  Define rectangular areas to black out (coordinates in points from bottom-left)
                </p>

                {areas.map((area, index) => (
                  <div key={area.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
                    <span className="text-sm font-medium text-muted-foreground w-16">
                      Area {index + 1}
                    </span>
                    <div className="grid grid-cols-5 gap-2 flex-1">
                      <div>
                        <Label className="text-xs">Page</Label>
                        <Input
                          type="number"
                          min={1}
                          value={area.page}
                          onChange={(e) => updateArea(area.id, "page", parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={area.x}
                          onChange={(e) => updateArea(area.id, "x", parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={area.y}
                          onChange={(e) => updateArea(area.id, "y", parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={area.width}
                          onChange={(e) => updateArea(area.id, "width", parseInt(e.target.value) || 50)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={area.height}
                          onChange={(e) => updateArea(area.id, "height", parseInt(e.target.value) || 50)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    {areas.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArea(area.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addArea}>
                  Add Another Area
                </Button>
              </div>

              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleRedact} className="px-8">
                  Redact PDF
                </Button>
              </div>
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
                ? "Your redacted PDF is ready for download!"
                : "Applying redactions..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Redact Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default RedactPDF;
