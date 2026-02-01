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
      className="tool-card group cursor-pointer opacity-0 animate-fade-in block p-4 sm:p-6 relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Animated shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className={cn(
        "tool-icon mb-3 sm:mb-4 h-10 w-10 sm:h-14 sm:w-14 transition-all duration-300",
        "group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg",
        colorClasses[color]
      )}>
        <Icon className="h-5 w-5 sm:h-7 sm:w-7 transition-transform duration-300 group-hover:animate-pulse" />
      </div>
      
      <h3 className="mb-1 sm:mb-2 text-sm sm:text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary line-clamp-1">
        {title}
      </h3>
      
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      <div className="mt-2 sm:mt-4 flex items-center text-xs sm:text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
        Use Tool 
        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
};

export default ToolCard;
