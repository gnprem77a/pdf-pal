import { ArrowRight, Sparkles, FileText, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse-soft" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating decorative icons */}
      <div className="absolute left-[10%] top-[20%] hidden lg:block">
        <div className="animate-float rounded-2xl bg-primary/10 p-3 text-primary">
          <FileText className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute right-[15%] top-[30%] hidden lg:block">
        <div className="animate-float-delayed rounded-2xl bg-accent/10 p-3 text-accent">
          <Shield className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute left-[8%] bottom-[25%] hidden lg:block">
        <div className="animate-float rounded-2xl bg-tool-compress/20 p-3 text-green-500" style={{ animationDelay: '1s' }}>
          <Zap className="h-6 w-6" />
        </div>
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground animate-bounce-subtle">
            <Sparkles className="h-4 w-4 text-accent animate-pulse-soft" />
            Free PDF tools, no signup required
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Every tool you need to{" "}
            <span className="gradient-text animate-gradient bg-gradient-to-r from-primary via-accent to-primary">work with PDFs</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks. Free and easy to use.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#tools">
              <Button size="lg" className="group rounded-full px-8 text-base relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Explore All Tools
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
