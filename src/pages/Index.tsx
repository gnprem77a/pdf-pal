import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentFiles from "@/components/RecentFiles";
import ToolsGrid from "@/components/ToolsGrid";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <RecentFiles />
        <ToolsGrid />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
