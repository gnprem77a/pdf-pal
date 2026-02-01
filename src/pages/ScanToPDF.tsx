import { useState, useRef, useCallback } from "react";
import { Camera, RotateCcw, Check, X, FlipHorizontal } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { downloadBlob } from "@/lib/pdf-utils";
import ProcessingStatus from "@/components/ProcessingStatus";

const ScanToPDF = () => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Unable to access camera. Please grant camera permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImages((prev) => [...prev, imageData]);
  }, []);

  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setTimeout(startCamera, 100);
  };

  const createPDF = async () => {
    if (capturedImages.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < capturedImages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const img = new Image();
        img.src = capturedImages[i];
        await new Promise((resolve) => { img.onload = resolve; });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let width = pageWidth - 20;
        let height = width / imgRatio;
        
        if (height > pageHeight - 20) {
          height = pageHeight - 20;
          width = height * imgRatio;
        }
        
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        
        pdf.addImage(capturedImages[i], "JPEG", x, y, width, height);
        setProgress(((i + 1) / capturedImages.length) * 80);
      }

      setProgress(90);
      const pdfBlob = pdf.output("blob");
      await downloadBlob(pdfBlob, `scanned-document-${Date.now()}.pdf`);
      
      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("PDF creation error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setCapturedImages([]);
    setStatus("idle");
    setProgress(0);
    stopCamera();
  };

  return (
    <ToolLayout
      title="Scan to PDF"
      description="Scan documents using your camera and convert to PDF"
      icon={Camera}
      color="image"
    >
      <canvas ref={canvasRef} className="hidden" />

      {status === "idle" || status === "error" ? (
        <>
          {!isStreaming ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-12">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">Start camera to scan documents</p>
              <Button onClick={startCamera} size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  <Button variant="secondary" size="icon" onClick={switchCamera}>
                    <FlipHorizontal className="h-5 w-5" />
                  </Button>
                  <Button size="lg" onClick={captureImage} className="rounded-full px-8">
                    <Camera className="mr-2 h-5 w-5" />
                    Capture
                  </Button>
                  <Button variant="destructive" size="icon" onClick={stopCamera}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {capturedImages.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Captured Pages ({capturedImages.length})</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {capturedImages.map((img, index) => (
                  <div key={index} className="group relative">
                    <img
                      src={img}
                      alt={`Page ${index + 1}`}
                      className="aspect-[3/4] w-full rounded-lg border object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <span className="absolute bottom-1 left-1 rounded bg-background/80 px-2 py-0.5 text-xs">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
                <Button onClick={createPDF} size="lg">
                  <Check className="mr-2 h-4 w-4" />
                  Create PDF ({capturedImages.length} pages)
                </Button>
              </div>
            </div>
          )}
        </>
      ) : status === "processing" ? (
        <ProcessingStatus status={status} progress={progress} message="Creating PDF from scanned images..." />
      ) : (
        <>
          <ProcessingStatus status={status} progress={progress} message="Your scanned PDF has been downloaded!" />
          <div className="mt-6 flex justify-center">
            <Button onClick={handleReset}>Scan Another Document</Button>
          </div>
        </>
      )}
    </ToolLayout>
  );
};

export default ScanToPDF;
