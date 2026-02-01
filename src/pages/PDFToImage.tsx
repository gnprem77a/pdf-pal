import { useState } from "react";
import { Image, Download } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { saveAs } from "file-saver";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ImageFormat = "png" | "jpeg";

const PDFToImage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState([90]);
  const [scale, setScale] = useState([2]);
  const [generatedImages, setGeneratedImages] = useState<{ name: string; dataUrl: string }[]>([]);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);
    setGeneratedImages([]);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(10);

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const images: { name: string; dataUrl: string }[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale[0] });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        const dataUrl = canvas.toDataURL(
          `image/${format}`,
          format === "jpeg" ? quality[0] / 100 : undefined
        );

        images.push({
          name: `page-${pageNum}.${format}`,
          dataUrl,
        });

        setProgress(10 + (pageNum / totalPages) * 80);
      }

      setGeneratedImages(images);
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Conversion error:", error);
      setStatus("error");
    }
  };

  const downloadSingle = (image: { name: string; dataUrl: string }) => {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = image.name;
    link.click();
  };

  const downloadAll = async () => {
    if (generatedImages.length === 1) {
      downloadSingle(generatedImages[0]);
      return;
    }

    const zip = new JSZip();
    
    for (const image of generatedImages) {
      const base64Data = image.dataUrl.split(",")[1];
      zip.file(image.name, base64Data, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "pdf-images.zip");
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setGeneratedImages([]);
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
      ) : status === "processing" ? (
        <ProcessingStatus
          status={status}
          progress={progress}
          message="Converting PDF pages to images..."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {generatedImages.length} Image{generatedImages.length > 1 ? "s" : ""} Generated
            </h3>
            <Button onClick={downloadAll}>
              <Download className="mr-2 h-4 w-4" />
              Download {generatedImages.length > 1 ? "All (ZIP)" : ""}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generatedImages.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border bg-card"
              >
                <img
                  src={image.dataUrl}
                  alt={`Page ${index + 1}`}
                  className="w-full object-contain"
                  style={{ maxHeight: "200px" }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadSingle(image)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {image.name}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button onClick={handleReset}>Convert Another PDF</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default PDFToImage;
