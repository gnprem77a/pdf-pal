import { useState } from "react";
import { Info } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import ProcessingStatus from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/pdf-utils";
import { PDFDocument } from "pdf-lib";

const PDFMetadata = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      try {
        const arrayBuffer = await newFiles[0].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setMetadata({
          title: pdf.getTitle() || "",
          author: pdf.getAuthor() || "",
          subject: pdf.getSubject() || "",
          keywords: pdf.getKeywords() || "",
          creator: pdf.getCreator() || "",
          producer: pdf.getProducer() || "",
        });
      } catch (error) {
        console.error("Error reading metadata:", error);
      }
    }
  };

  const handleSave = async () => {
    if (files.length === 0) return;

    setStatus("processing");
    setProgress(0);

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(30);

      const pdf = await PDFDocument.load(arrayBuffer);

      if (metadata.title) pdf.setTitle(metadata.title);
      if (metadata.author) pdf.setAuthor(metadata.author);
      if (metadata.subject) pdf.setSubject(metadata.subject);
      if (metadata.keywords) pdf.setKeywords([metadata.keywords]);
      if (metadata.creator) pdf.setCreator(metadata.creator);
      if (metadata.producer) pdf.setProducer(metadata.producer);

      setProgress(70);
      const pdfBytes = await pdf.save();
      const buffer = new ArrayBuffer(pdfBytes.length);
      new Uint8Array(buffer).set(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });

      const originalName = files[0].name.replace(".pdf", "");
      await downloadBlob(blob, `${originalName}-metadata.pdf`);

      setProgress(100);
      setStatus("success");
    } catch (error) {
      console.error("Metadata error:", error);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setMetadata({
      title: "",
      author: "",
      subject: "",
      keywords: "",
      creator: "",
      producer: "",
    });
  };

  return (
    <ToolLayout
      title="PDF Metadata"
      description="Edit PDF document properties"
      icon={Info}
      color="compress"
    >
      {status === "idle" || status === "error" ? (
        <>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to edit metadata"
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) =>
                      setMetadata({ ...metadata, title: e.target.value })
                    }
                    placeholder="Document title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={metadata.author}
                    onChange={(e) =>
                      setMetadata({ ...metadata, author: e.target.value })
                    }
                    placeholder="Author name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={metadata.subject}
                    onChange={(e) =>
                      setMetadata({ ...metadata, subject: e.target.value })
                    }
                    placeholder="Document subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={metadata.keywords}
                    onChange={(e) =>
                      setMetadata({ ...metadata, keywords: e.target.value })
                    }
                    placeholder="keyword1, keyword2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creator">Creator</Label>
                  <Input
                    id="creator"
                    value={metadata.creator}
                    onChange={(e) =>
                      setMetadata({ ...metadata, creator: e.target.value })
                    }
                    placeholder="Creator application"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer">Producer</Label>
                  <Input
                    id="producer"
                    value={metadata.producer}
                    onChange={(e) =>
                      setMetadata({ ...metadata, producer: e.target.value })
                    }
                    placeholder="Producer application"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleSave} className="px-8">
                  Save Metadata
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
                ? "Your PDF with updated metadata has been downloaded!"
                : "Updating metadata..."
            }
          />

          {status === "success" && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleReset}>Edit Another PDF</Button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  );
};

export default PDFMetadata;
