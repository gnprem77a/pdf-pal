import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "merge" | "split" | "compress" | "word" | "image" | "protect";
  children: ReactNode;
}

const colorClasses = {
  merge: "bg-tool-merge",
  split: "bg-tool-split",
  compress: "bg-tool-compress",
  word: "bg-tool-word",
  image: "bg-tool-image",
  protect: "bg-tool-protect",
};

const ToolLayout = ({
  title,
  description,
  icon: Icon,
  color,
  children,
}: ToolLayoutProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Prefer going back in history so we return to the existing Home entry,
    // which preserves scroll position.
    const state = window.history.state as { idx?: number } | null;
    const idx = state?.idx;

    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }

    // Fallback: no history available (direct entry)
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={cn("rounded-xl p-2.5 text-white", colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
};

export default ToolLayout;
