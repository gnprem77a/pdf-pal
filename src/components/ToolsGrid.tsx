import { useState } from "react";
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
  PenTool,
  Layers,
  FileOutput,
  Camera,
  Wrench,
  Presentation,
  Sheet,
  Code,
  Crop,
  EyeOff,
  GitCompare,
  FileCheck
} from "lucide-react";
import ToolCard from "./ToolCard";

type Category = "all" | "organize" | "optimize" | "convert" | "edit" | "security";

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "organize", label: "Organize PDF" },
  { id: "optimize", label: "Optimize PDF" },
  { id: "convert", label: "Convert PDF" },
  { id: "edit", label: "Edit PDF" },
  { id: "security", label: "PDF Security" },
];

const tools = [
  // ORGANIZE PDF
  {
    icon: Merge,
    title: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    color: "merge" as const,
    href: "/merge-pdf",
    category: "organize" as Category,
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Separate one PDF into multiple files.",
    color: "split" as const,
    href: "/split-pdf",
    category: "organize" as Category,
  },
  {
    icon: Trash2,
    title: "Remove Pages",
    description: "Remove specific pages from PDF.",
    color: "split" as const,
    href: "/delete-pages",
    category: "organize" as Category,
  },
  {
    icon: FileOutput,
    title: "Extract Pages",
    description: "Extract specific pages to a new PDF.",
    color: "split" as const,
    href: "/extract-pages",
    category: "organize" as Category,
  },
  {
    icon: ArrowUpDown,
    title: "Organize PDF",
    description: "Drag and drop to rearrange pages.",
    color: "merge" as const,
    href: "/reorder-pages",
    category: "organize" as Category,
  },
  {
    icon: Camera,
    title: "Scan to PDF",
    description: "Auto-enhance + OCR for searchable PDFs.",
    color: "image" as const,
    href: "/scan-to-pdf",
    category: "organize" as Category,
  },
  // OPTIMIZE PDF
  {
    icon: FileDown,
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality.",
    color: "compress" as const,
    href: "/compress-pdf",
    category: "optimize" as Category,
  },
  {
    icon: Wrench,
    title: "Repair PDF",
    description: "Fix corrupted or damaged PDF files.",
    color: "compress" as const,
    href: "/repair-pdf",
    category: "optimize" as Category,
  },
  {
    icon: FileSearch,
    title: "OCR PDF",
    description: "Extract text from scanned PDFs.",
    color: "compress" as const,
    href: "/ocr-pdf",
    category: "optimize" as Category,
  },
  // CONVERT TO PDF
  {
    icon: Image,
    title: "Image to PDF",
    description: "Convert JPG, PNG, and other images to PDF.",
    color: "image" as const,
    href: "/image-to-pdf",
    category: "convert" as Category,
  },
  {
    icon: FileUp,
    title: "Word to PDF",
    description: "Convert Word documents to PDF.",
    color: "word" as const,
    href: "/word-to-pdf",
    category: "convert" as Category,
  },
  {
    icon: Presentation,
    title: "PowerPoint to PDF",
    description: "Convert presentations to PDF.",
    color: "image" as const,
    href: "/powerpoint-to-pdf",
    category: "convert" as Category,
  },
  {
    icon: Sheet,
    title: "Excel to PDF",
    description: "Convert spreadsheets to PDF.",
    color: "compress" as const,
    href: "/excel-to-pdf",
    category: "convert" as Category,
  },
  {
    icon: Code,
    title: "HTML to PDF",
    description: "Convert HTML content to PDF.",
    color: "word" as const,
    href: "/html-to-pdf",
    category: "convert" as Category,
  },
  // CONVERT FROM PDF
  {
    icon: Image,
    title: "PDF to Image",
    description: "Convert PDF pages to JPG or PNG.",
    color: "image" as const,
    href: "/pdf-to-image",
    category: "convert" as Category,
  },
  {
    icon: FileType,
    title: "PDF to Word",
    description: "Convert PDF to editable Word documents.",
    color: "word" as const,
    href: "/pdf-to-word",
    category: "convert" as Category,
  },
  {
    icon: Presentation,
    title: "PDF to PowerPoint",
    description: "Convert PDF to presentations.",
    color: "image" as const,
    href: "/pdf-to-powerpoint",
    category: "convert" as Category,
  },
  {
    icon: Sheet,
    title: "PDF to Excel",
    description: "Convert PDF tables to spreadsheets.",
    color: "compress" as const,
    href: "/pdf-to-excel",
    category: "convert" as Category,
  },
  {
    icon: FileCheck,
    title: "PDF to PDF/A",
    description: "Convert to archival format.",
    color: "protect" as const,
    href: "/pdf-to-pdfa",
    category: "convert" as Category,
  },
  {
    icon: FileText,
    title: "PDF to Text",
    description: "Extract plain text from PDF files.",
    color: "word" as const,
    href: "/pdf-to-text",
    category: "convert" as Category,
  },
  // EDIT PDF
  {
    icon: RotateCw,
    title: "Rotate PDF",
    description: "Rotate pages to correct orientation.",
    color: "merge" as const,
    href: "/rotate-pdf",
    category: "edit" as Category,
  },
  {
    icon: Hash,
    title: "Add Page Numbers",
    description: "Add page numbers to your PDF.",
    color: "merge" as const,
    href: "/add-page-numbers",
    category: "edit" as Category,
  },
  {
    icon: Stamp,
    title: "Add Watermark",
    description: "Add text watermarks to PDFs.",
    color: "split" as const,
    href: "/watermark-pdf",
    category: "edit" as Category,
  },
  {
    icon: Crop,
    title: "Crop PDF",
    description: "Adjust margins and crop pages.",
    color: "split" as const,
    href: "/crop-pdf",
    category: "edit" as Category,
  },
  {
    icon: FileText,
    title: "Edit PDF",
    description: "Add text and annotations.",
    color: "word" as const,
    href: "/edit-pdf",
    category: "edit" as Category,
  },
  {
    icon: AlignVerticalSpaceAround,
    title: "Header & Footer",
    description: "Insert headers and footers.",
    color: "split" as const,
    href: "/add-header-footer",
    category: "edit" as Category,
  },
  {
    icon: Info,
    title: "PDF Metadata",
    description: "Edit document properties.",
    color: "compress" as const,
    href: "/pdf-metadata",
    category: "edit" as Category,
  },
  // PDF SECURITY
  {
    icon: Unlock,
    title: "Unlock PDF",
    description: "Remove restrictions from PDF.",
    color: "protect" as const,
    href: "/unlock-pdf",
    category: "security" as Category,
  },
  {
    icon: Lock,
    title: "Protect PDF",
    description: "Add password protection.",
    color: "protect" as const,
    href: "/protect-pdf",
    category: "security" as Category,
  },
  {
    icon: PenTool,
    title: "Sign PDF",
    description: "Add your signature to documents.",
    color: "protect" as const,
    href: "/esign-pdf",
    category: "security" as Category,
  },
  {
    icon: EyeOff,
    title: "Redact PDF",
    description: "Permanently remove sensitive info.",
    color: "protect" as const,
    href: "/redact-pdf",
    category: "security" as Category,
  },
  {
    icon: GitCompare,
    title: "Compare PDF",
    description: "Compare two PDFs side-by-side.",
    color: "word" as const,
    href: "/compare-pdf",
    category: "security" as Category,
  },
  // BATCH
  {
    icon: Layers,
    title: "Batch Process",
    description: "Process multiple PDFs at once.",
    color: "merge" as const,
    href: "/batch-process",
    category: "optimize" as Category,
  },
];

const ToolsGrid = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filteredTools = activeCategory === "all" 
    ? tools 
    : tools.filter(tool => tool.category === activeCategory);

  return (
    <section id="tools" className="py-20">
      <div className="container">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            All the PDF tools you need
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Access a complete set of PDF tools to edit, convert, and optimize your documents — all in one place.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              color={tool.color}
              delay={index * 20}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
