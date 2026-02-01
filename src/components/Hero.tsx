import { ArrowRight, Sparkles, FileText, Shield, Zap, Layers, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Animated background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse-soft" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-tool-split/5 blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.05]">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating decorative icons with enhanced animations */}
      <div className="absolute left-[10%] top-[20%] hidden lg:block">
        <div className="animate-float rounded-2xl bg-primary/10 p-3 text-primary shadow-lg shadow-primary/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/30">
          <FileText className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute right-[15%] top-[30%] hidden lg:block">
        <div className="animate-float-delayed rounded-2xl bg-accent/10 p-3 text-accent shadow-lg shadow-accent/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-accent/30">
          <Shield className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute left-[8%] bottom-[25%] hidden lg:block">
        <div className="animate-float rounded-2xl bg-tool-compress/20 p-3 text-green-500 shadow-lg shadow-green-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-green-500/30" style={{ animationDelay: '1s' }}>
          <Zap className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute right-[8%] bottom-[35%] hidden lg:block">
        <div className="animate-float rounded-2xl bg-tool-split/20 p-3 text-purple-500 shadow-lg shadow-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/30" style={{ animationDelay: '2s' }}>
          <Layers className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute left-[20%] top-[60%] hidden lg:block">
        <div className="animate-float-delayed rounded-2xl bg-tool-protect/20 p-3 text-pink-500 shadow-lg shadow-pink-500/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-pink-500/30" style={{ animationDelay: '0.5s' }}>
          <Lock className="h-5 w-5" />
        </div>
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground animate-bounce-subtle backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent animate-spin-slow" />
            Free PDF tools, no signup required
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Every tool you need to{" "}
            <span className="gradient-text animate-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]">work with PDFs</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks. Free and easy to use.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: '400ms' }}>
            <a href="#tools">
              <Button size="lg" className="group rounded-full px-8 text-base relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:scale-105">
                <span className="relative z-10 flex items-center">
                  Explore All Tools
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base transition-all duration-300 hover:scale-105 hover:bg-secondary">
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
