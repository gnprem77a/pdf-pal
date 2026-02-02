import { Loader2, CheckCircle2, XCircle, Download, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessingStatusProps {
  status: "idle" | "processing" | "success" | "error";
  progress?: number;
  message?: string;
}

const ProcessingStatus = ({
  status,
  progress = 0,
  message,
}: ProcessingStatusProps) => {
  if (status === "idle") return null;

  return (
    <div className={cn(
      "mt-6 rounded-2xl border p-6 transition-all duration-500 animate-fade-in",
      status === "processing" && "bg-gradient-to-br from-card to-primary/5 border-primary/20",
      status === "success" && "bg-gradient-to-br from-card to-success/10 border-success/30",
      status === "error" && "bg-gradient-to-br from-card to-destructive/10 border-destructive/30"
    )}>
      <div className="flex items-start gap-4">
        {/* Status icon with animation */}
        <div className={cn(
          "relative flex-shrink-0 rounded-full p-3 transition-all duration-500",
          status === "processing" && "bg-primary/10",
          status === "success" && "bg-success/10",
          status === "error" && "bg-destructive/10"
        )}>
          {status === "processing" && (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-7 w-7 text-success" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-success animate-pulse-soft" />
            </>
          )}
          {status === "error" && (
            <XCircle className="h-7 w-7 text-destructive" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-lg font-semibold transition-colors",
            status === "processing" && "text-foreground",
            status === "success" && "text-success",
            status === "error" && "text-destructive"
          )}>
            {status === "processing" && "Processing your file..."}
            {status === "success" && "Ready for download!"}
            {status === "error" && "Something went wrong"}
          </p>
          
          {message && (
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          )}

          {/* Progress bar for processing */}
          {status === "processing" && (
            <div className="mt-4 space-y-2">
              <div className="relative">
                <Progress value={progress} className="h-2" />
                {/* Shimmer effect on progress bar */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-full"
                  style={{ animationDuration: '2s' }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading & processing</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Success indicator */}
          {status === "success" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-success">
              <Download className="h-4 w-4" />
              <span>Your download should start automatically</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing animation dots */}
      {status === "processing" && (
        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;