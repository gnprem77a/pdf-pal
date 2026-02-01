import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">PDFTools</span>
        </a>
        
        <nav className="hidden items-center gap-6 md:flex">
          <a href="/#tools" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Tools
          </a>
          <a href="/batch-process" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Batch Process
          </a>
          <a href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button className="rounded-full px-6">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
