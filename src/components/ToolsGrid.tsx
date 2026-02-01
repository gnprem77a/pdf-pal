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
  FileText
} from "lucide-react";
import ToolCard from "./ToolCard";

const tools = [
  {
    icon: Merge,
    title: "Merge PDF",
    description: "Combine multiple PDFs into one document in seconds.",
    color: "merge" as const,
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Separate one PDF into multiple files easily.",
    color: "split" as const,
  },
  {
    icon: FileDown,
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality.",
    color: "compress" as const,
  },
  {
    icon: FileType,
    title: "PDF to Word",
    description: "Convert your PDF files into editable Word documents.",
    color: "word" as const,
  },
  {
    icon: Image,
    title: "PDF to Image",
    description: "Extract images or convert pages to JPG/PNG.",
    color: "image" as const,
  },
  {
    icon: Lock,
    title: "Protect PDF",
    description: "Add password protection to your PDF files.",
    color: "protect" as const,
  },
  {
    icon: RotateCw,
    title: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation.",
    color: "merge" as const,
  },
  {
    icon: Stamp,
    title: "Watermark",
    description: "Add text or image watermarks to your PDFs.",
    color: "split" as const,
  },
  {
    icon: FileSearch,
    title: "OCR PDF",
    description: "Make scanned PDFs searchable with text recognition.",
    color: "compress" as const,
  },
  {
    icon: FileText,
    title: "Edit PDF",
    description: "Add text, shapes, and annotations to PDFs.",
    color: "word" as const,
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              color={tool.color}
              delay={index * 50}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
