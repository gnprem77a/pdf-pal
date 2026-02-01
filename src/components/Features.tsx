import { Shield, Zap, Cloud, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process your PDFs in seconds with our optimized cloud infrastructure.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Files are encrypted and automatically deleted after processing.",
  },
  {
    icon: Cloud,
    title: "Works Anywhere",
    description: "No software to install. Works on any device with a browser.",
  },
  {
    icon: Globe,
    title: "Always Free",
    description: "Core tools are free forever. No hidden fees or subscriptions.",
  },
];

const Features = () => {
  return (
    <section id="features" className="border-y border-border bg-secondary/30 py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Why choose PDFTools?
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            We've built the fastest, most secure PDF tools on the web.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group text-center opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
