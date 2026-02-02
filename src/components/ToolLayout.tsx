import { ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
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
    nav: "text-[hsl(0,84%,60%)]",
    bg: "bg-[hsl(0,0%,97%)]",
  },
  split: {
    nav: "text-[hsl(262,83%,58%)]",
    bg: "bg-[hsl(262,83%,98%)]",
  },
  compress: {
    nav: "text-[hsl(142,71%,45%)]",
    bg: "bg-[hsl(142,71%,98%)]",
  },
  word: {
    nav: "text-[hsl(217,91%,60%)]",
    bg: "bg-[hsl(217,91%,98%)]",
  },
  image: {
    nav: "text-[hsl(15,90%,60%)]",
    bg: "bg-[hsl(15,90%,98%)]",
  },
  protect: {
    nav: "text-[hsl(340,82%,52%)]",
    bg: "bg-[hsl(340,82%,98%)]",
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

  const hasFile = previewFile !== null && previewFile !== undefined;

  return (
    <div className={cn("min-h-screen", colors.bg)}>
      {/* Header - exactly like iLovePDF */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-white">
        <div className="container flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 font-bold text-xl">
            <span className="text-foreground">Instant</span>
            <span className="text-[hsl(0,84%,60%)]">PDF</span>
          </Link>
          
          {/* Navigation - desktop only */}
          {!isMobile && (
            <nav className="flex items-center gap-8">
              <Link 
                to="/merge-pdf" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[hsl(0,84%,60%)]",
                  color === "merge" ? colors.nav : "text-foreground"
                )}
              >
                MERGE PDF
              </Link>
              <Link 
                to="/split-pdf" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[hsl(0,84%,60%)]",
                  color === "split" ? colors.nav : "text-foreground"
                )}
              >
                SPLIT PDF
              </Link>
              <Link 
                to="/compress-pdf" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[hsl(0,84%,60%)]",
                  color === "compress" ? colors.nav : "text-foreground"
                )}
              >
                COMPRESS PDF
              </Link>
              <Link 
                to="/" 
                className="text-sm font-medium text-foreground transition-colors hover:text-[hsl(0,84%,60%)]"
              >
                ALL PDF TOOLS ▾
              </Link>
            </nav>
          )}
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isMobile && (
              <>
                <Link to="/login" className="text-sm font-medium text-foreground hover:text-[hsl(0,84%,60%)]">
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-4 py-2 text-sm font-medium text-white bg-[hsl(0,84%,60%)] rounded-md hover:bg-[hsl(0,84%,55%)] transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
            {isMobile && (
              <button 
                onClick={() => navigate("/")}
                className="p-2 text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {!hasFile ? (
          /* Initial state - Centered upload exactly like iLovePDF */
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">
              {title}
            </h1>
            
            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
              {description}
            </p>

            {/* Upload area */}
            <div className="w-full max-w-lg">
              {children}
            </div>
          </div>
        ) : (
          /* File uploaded - Show controls with preview */
          <div className="container py-8">
            <div className={cn(
              "grid gap-6",
              isMobile ? "grid-cols-1" : "grid-cols-[1fr,380px]"
            )}>
              {/* Left - Tool controls */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                {children}
              </div>

              {/* Right - Preview (desktop only) */}
              {!isMobile && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <ToolPreviewPanel file={previewFile} className="h-[600px]" />
                </div>
              )}
            </div>

            {/* Mobile preview */}
            {isMobile && (
              <div className="mt-6 bg-white rounded-xl border shadow-sm overflow-hidden">
                <ToolPreviewPanel file={previewFile} className="h-[350px]" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-3 text-center text-xs text-muted-foreground">
        © InstantPDF 2026 ® - Your PDF Editor
      </footer>
    </div>
  );
};

export default ToolLayout;
