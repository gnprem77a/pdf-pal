import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "merge" | "split" | "compress" | "word" | "image" | "protect";
  delay?: number;
  href: string;
}

const colorClasses = {
  merge: "bg-tool-merge",
  split: "bg-tool-split",
  compress: "bg-tool-compress",
  word: "bg-tool-word",
  image: "bg-tool-image",
  protect: "bg-tool-protect",
};

const ToolCard = ({ icon: Icon, title, description, color, delay = 0, href }: ToolCardProps) => {
  return (
    <Link
      to={href}
      className="tool-card group cursor-pointer opacity-0 animate-fade-in block"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("tool-icon mb-4 group-hover:animate-wiggle", colorClasses[color])}>
        <Icon className="h-7 w-7" />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
        Use Tool →
      </div>
    </Link>
  );
};

export default ToolCard;
