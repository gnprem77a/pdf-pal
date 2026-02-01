import { 
  Merge, 
  Scissors, 
  FileDown, 
  FileType, 
  Image, 
  Lock,
  RotateCw,
  Stamp,
  FileSearch,
  FileText,
  FileUp
} from "lucide-react";
import ToolCard from "./ToolCard";

const tools = [
  {
    icon: Merge,
    title: "Merge PDF",
    description: "Combine multiple PDFs into one document in seconds.",
    color: "merge" as const,
    href: "/merge-pdf",
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Separate one PDF into multiple files easily.",
    color: "split" as const,
    href: "/split-pdf",
  },
  {
    icon: FileDown,
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality.",
    color: "compress" as const,
    href: "/compress-pdf",
  },
  {
    icon: FileType,
    title: "PDF to Word",
    description: "Convert your PDF files into editable Word documents.",
    color: "word" as const,
    href: "/pdf-to-word",
  },
  {
    icon: FileUp,
    title: "Word to PDF",
    description: "Convert Word documents to PDF format.",
    color: "word" as const,
    href: "/word-to-pdf",
  },
  {
    icon: Image,
    title: "PDF to Image",
    description: "Extract images or convert pages to JPG/PNG.",
    color: "image" as const,
    href: "/pdf-to-image",
  },
  {
    icon: Lock,
    title: "Protect PDF",
    description: "Add password protection to your PDF files.",
    color: "protect" as const,
    href: "/protect-pdf",
  },
  {
    icon: RotateCw,
    title: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation.",
    color: "merge" as const,
    href: "/rotate-pdf",
  },
  {
    icon: Stamp,
    title: "Watermark",
    description: "Add text or image watermarks to your PDFs.",
    color: "split" as const,
    href: "/watermark-pdf",
  },
  {
    icon: FileSearch,
    title: "OCR PDF",
    description: "Make scanned PDFs searchable with text recognition.",
    color: "compress" as const,
    href: "/ocr-pdf",
  },
  {
    icon: FileText,
    title: "Edit PDF",
    description: "Add text, shapes, and annotations to PDFs.",
    color: "word" as const,
    href: "/edit-pdf",
  },
];

const ToolsGrid = () => {
  return (
    <section id="tools" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            All the PDF tools you need
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Access a complete set of PDF tools to edit, convert, and optimize your documents — all in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              color={tool.color}
              delay={index * 50}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
