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
  FileUp,
  Trash2,
  Hash,
  ArrowUpDown,
  AlignVerticalSpaceAround,
  Info,
  Unlock,
  PenTool
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
    icon: FileText,
    title: "PDF to Text",
    description: "Extract plain text from PDF files.",
    color: "word" as const,
    href: "/pdf-to-text",
  },
  {
    icon: Image,
    title: "Image to PDF",
    description: "Convert images to PDF format.",
    color: "image" as const,
    href: "/image-to-pdf",
  },
  {
    icon: Image,
    title: "PDF to Image",
    description: "Convert PDF pages to JPG/PNG images.",
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
    icon: Unlock,
    title: "Unlock PDF",
    description: "Remove restrictions from PDF files.",
    color: "protect" as const,
    href: "/unlock-pdf",
  },
  {
    icon: RotateCw,
    title: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation.",
    color: "merge" as const,
    href: "/rotate-pdf",
  },
  {
    icon: ArrowUpDown,
    title: "Reorder Pages",
    description: "Drag and drop to rearrange PDF pages.",
    color: "merge" as const,
    href: "/reorder-pages",
  },
  {
    icon: Trash2,
    title: "Delete Pages",
    description: "Remove specific pages from your PDF.",
    color: "split" as const,
    href: "/delete-pages",
  },
  {
    icon: Stamp,
    title: "Watermark",
    description: "Add text or image watermarks to your PDFs.",
    color: "split" as const,
    href: "/watermark-pdf",
  },
  {
    icon: Hash,
    title: "Page Numbers",
    description: "Add page numbers to your PDF documents.",
    color: "merge" as const,
    href: "/add-page-numbers",
  },
  {
    icon: AlignVerticalSpaceAround,
    title: "Header & Footer",
    description: "Insert headers and footers to your PDFs.",
    color: "split" as const,
    href: "/add-header-footer",
  },
  {
    icon: Info,
    title: "PDF Metadata",
    description: "Edit PDF document properties.",
    color: "compress" as const,
    href: "/pdf-metadata",
  },
  {
    icon: PenTool,
    title: "E-Sign PDF",
    description: "Add your signature to PDF documents.",
    color: "protect" as const,
    href: "/esign-pdf",
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              color={tool.color}
              delay={index * 30}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
