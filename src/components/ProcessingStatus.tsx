import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    <div className="mt-6 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-4">
        {status === "processing" && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        {status === "success" && (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        )}
        {status === "error" && <XCircle className="h-6 w-6 text-destructive" />}

        <div className="flex-1">
          <p className="font-medium text-foreground">
            {status === "processing" && "Processing..."}
            {status === "success" && "Complete!"}
            {status === "error" && "Error"}
          </p>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>

      {status === "processing" && (
        <Progress value={progress} className="mt-4" />
      )}
    </div>
  );
};

export default ProcessingStatus;
