import { FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" fill="currentColor" opacity="0.2" />
                <polyline points="13 2 13 9 20 9" />
                <path d="M9 17l2-2 2 2" strokeWidth="2.5" />
                <path d="M11 15v4" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">InstantPDF</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Contact
            </a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2026 InstantPDF. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
