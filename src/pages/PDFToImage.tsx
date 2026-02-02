import { useState } from "react";
import { Image } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useBackendPdf, getBaseName } from "@/hooks/use-backend-pdf";

type ImageFormat = "png" | "jpeg";

const PDFToImage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [dpi, setDpi] = useState([150]);

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "pdfToImage",
      files,
      { 
        format, 
        dpi: dpi[0].toString()
      },
      `${baseName}-images.zip`
    );
  };

  const handleReset = () => {
    setFiles([]);
    reset();
  };

  return (
    <ToolLayout
      title="PDF to Image"
      description="Convert PDF pages to JPG or PNG images"
      icon={Image}
      color="image"
      previewFile={files.length > 0 ? files[0] : null}
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            title="Drop your PDF file here"
            description="Select a PDF to convert to images"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Image Format</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as ImageFormat)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="png" id="png" />
                    <Label htmlFor="png">PNG (lossless)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jpeg" id="jpeg" />
                    <Label htmlFor="jpeg">JPEG (smaller)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Resolution: {dpi[0]} DPI
                </Label>
                <Slider
                  value={dpi}
                  onValueChange={setDpi}
                  min={72}
                  max={300}
                  step={30}
                />
                <p className="text-sm text-muted-foreground">
                  Higher DPI = better quality, larger files
                </p>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleConvert} className="px-8">
                  Convert to Images
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
                ? "Your images are ready for download!"
                : "Uploading and converting PDF..."
            }
          />
          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Convert Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default PDFToImage;
