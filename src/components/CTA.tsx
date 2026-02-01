import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-center md:p-16">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-0">
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to simplify your PDF workflow?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
              Join millions of users who trust PDFTools for their document needs. No signup required.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="group rounded-full px-8 text-base font-semibold"
            >
              Start Using PDFTools
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
