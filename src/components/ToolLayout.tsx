import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ToolPreviewPanel from "./ToolPreviewPanel";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "merge" | "split" | "compress" | "word" | "image" | "protect";
  children: ReactNode;
  previewFile?: File | null;
}

const colorClasses = {
  merge: {
    bg: "bg-[hsl(243,75%,59%)]",
    bgLight: "bg-[hsl(243,75%,97%)]",
    text: "text-[hsl(243,75%,59%)]",
    border: "border-[hsl(243,75%,90%)]",
    hover: "hover:bg-[hsl(243,75%,55%)]",
  },
  split: {
    bg: "bg-[hsl(262,83%,58%)]",
    bgLight: "bg-[hsl(262,83%,97%)]",
    text: "text-[hsl(262,83%,58%)]",
    border: "border-[hsl(262,83%,90%)]",
    hover: "hover:bg-[hsl(262,83%,54%)]",
  },
  compress: {
    bg: "bg-[hsl(142,71%,45%)]",
    bgLight: "bg-[hsl(142,71%,97%)]",
    text: "text-[hsl(142,71%,45%)]",
    border: "border-[hsl(142,71%,90%)]",
    hover: "hover:bg-[hsl(142,71%,40%)]",
  },
  word: {
    bg: "bg-[hsl(217,91%,60%)]",
    bgLight: "bg-[hsl(217,91%,97%)]",
    text: "text-[hsl(217,91%,60%)]",
    border: "border-[hsl(217,91%,90%)]",
    hover: "hover:bg-[hsl(217,91%,55%)]",
  },
  image: {
    bg: "bg-[hsl(15,90%,60%)]",
    bgLight: "bg-[hsl(15,90%,97%)]",
    text: "text-[hsl(15,90%,60%)]",
    border: "border-[hsl(15,90%,90%)]",
    hover: "hover:bg-[hsl(15,90%,55%)]",
  },
  protect: {
    bg: "bg-[hsl(340,82%,52%)]",
    bgLight: "bg-[hsl(340,82%,97%)]",
    text: "text-[hsl(340,82%,52%)]",
    border: "border-[hsl(340,82%,90%)]",
    hover: "hover:bg-[hsl(340,82%,48%)]",
  },
};

const ToolLayout = ({
  title,
  description,
  icon: Icon,
  color,
  children,
  previewFile,
}: ToolLayoutProps) => {
  const navigate = useNavigate();
  const colors = colorClasses[color];
  const isMobile = useIsMobile();

  const handleBack = () => {
    const state = window.history.state as { idx?: number } | null;
    const idx = state?.idx;

    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  const hasFile = previewFile !== null && previewFile !== undefined;

  return (
    <div className={cn("min-h-screen", colors.bgLight)}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back"
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <nav className="hidden md:flex items-center gap-6">
            <span className={cn("font-medium", colors.text)}>{title.toUpperCase()}</span>
          </nav>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main content */}
      <main className="container relative z-10">
        {!hasFile ? (
          /* Initial state - Centered upload */
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-12">
            {/* Title and description */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {description}
              </p>
            </div>

            {/* Upload area with tool icon */}
            <div className="w-full max-w-xl">
              {children}
            </div>
          </div>
        ) : (
          /* File uploaded - Split view */
          <div className="py-8">
            {/* Title bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className={cn("rounded-xl p-2.5 text-white", colors.bg)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>

            {/* Split view layout */}
            <div className={cn(
              "grid gap-6",
              isMobile ? "grid-cols-1" : "grid-cols-[1fr,400px]"
            )}>
              {/* Left - Tool controls */}
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                {children}
              </div>

              {/* Right - Preview */}
              {!isMobile && (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <ToolPreviewPanel file={previewFile} className="h-[600px]" />
                </div>
              )}
            </div>

            {/* Mobile preview */}
            {isMobile && (
              <div className="mt-6 bg-white rounded-2xl border shadow-sm overflow-hidden">
                <ToolPreviewPanel file={previewFile} className="h-[400px]" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ToolLayout;
