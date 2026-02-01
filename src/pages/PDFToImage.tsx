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
  const [quality, setQuality] = useState([90]);
  const [scale, setScale] = useState([2]);

  const { status, progress, processFiles, reset } = useBackendPdf();

  const handleConvert = async () => {
    if (files.length === 0) return;
    const baseName = getBaseName(files[0].name);
    await processFiles(
      "pdfToImage",
      files,
      { 
        format, 
        quality: quality[0].toString(),
        scale: scale[0].toString()
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
                  Scale: {scale[0]}x ({scale[0] === 1 ? "72" : scale[0] === 2 ? "144" : "216"} DPI)
                </Label>
                <Slider
                  value={scale}
                  onValueChange={setScale}
                  min={1}
                  max={3}
                  step={0.5}
                />
              </div>

              {format === "jpeg" && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Quality: {quality[0]}%
                  </Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
              )}

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
