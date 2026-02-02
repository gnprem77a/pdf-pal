import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LucideIcon, Sparkles } from "lucide-react";
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
  merge: {
    bg: "bg-tool-merge",
    gradient: "from-[hsl(243,75%,59%)] to-[hsl(262,83%,58%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(243,75%,59%/0.5)]",
    ring: "ring-[hsl(243,75%,59%/0.3)]",
  },
  split: {
    bg: "bg-tool-split",
    gradient: "from-[hsl(262,83%,58%)] to-[hsl(280,80%,55%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(262,83%,58%/0.5)]",
    ring: "ring-[hsl(262,83%,58%/0.3)]",
  },
  compress: {
    bg: "bg-tool-compress",
    gradient: "from-[hsl(142,71%,45%)] to-[hsl(160,70%,40%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(142,71%,45%/0.5)]",
    ring: "ring-[hsl(142,71%,45%/0.3)]",
  },
  word: {
    bg: "bg-tool-word",
    gradient: "from-[hsl(217,91%,60%)] to-[hsl(230,85%,55%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(217,91%,60%/0.5)]",
    ring: "ring-[hsl(217,91%,60%/0.3)]",
  },
  image: {
    bg: "bg-tool-image",
    gradient: "from-[hsl(15,90%,60%)] to-[hsl(30,85%,55%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(15,90%,60%/0.5)]",
    ring: "ring-[hsl(15,90%,60%/0.3)]",
  },
  protect: {
    bg: "bg-tool-protect",
    gradient: "from-[hsl(340,82%,52%)] to-[hsl(355,80%,50%)]",
    glow: "shadow-[0_0_60px_-10px_hsl(340,82%,52%/0.5)]",
    ring: "ring-[hsl(340,82%,52%/0.3)]",
  },
};

const ToolLayout = ({
  title,
  description,
  icon: Icon,
  color,
  children,
}: ToolLayoutProps) => {
  const navigate = useNavigate();
  const colors = colorClasses[color];

  const handleBack = () => {
    const state = window.history.state as { idx?: number } | null;
    const idx = state?.idx;

    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse-soft",
          `bg-gradient-to-br ${colors.gradient}`
        )} />
        <div className={cn(
          "absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float",
          `bg-gradient-to-tr ${colors.gradient}`
        )} />
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-5",
          `bg-gradient-to-r ${colors.gradient}`
        )} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center gap-4 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back"
            className="rounded-xl hover:bg-secondary/80 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className={cn(
              "relative rounded-2xl p-3 text-white transition-all duration-500",
              `bg-gradient-to-br ${colors.gradient}`,
              colors.glow
            )}>
              <Icon className="h-7 w-7 relative z-10" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                <Sparkles className="h-4 w-4 text-primary animate-pulse-soft" />
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container relative z-10 py-8 md:py-12">
        <div className="mx-auto max-w-3xl animate-fade-in">
          {/* Glass card container */}
          <div className={cn(
            "rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 md:p-8",
            "shadow-xl ring-1",
            colors.ring
          )}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ToolLayout;