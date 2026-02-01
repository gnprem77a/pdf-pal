import { FileText, Check, X, Loader2, Clock, RotateCcw, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FileStatus = "pending" | "processing" | "complete" | "error";

export interface BatchFileItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  result?: Blob;
  error?: string;
}

interface BatchFileCardProps {
  item: BatchFileItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onDownload: (item: BatchFileItem) => void;
}

const statusConfig: Record<FileStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Waiting" },
  processing: { icon: Loader2, color: "text-primary", label: "Processing" },
  complete: { icon: Check, color: "text-green-500", label: "Complete" },
  error: { icon: X, color: "text-destructive", label: "Failed" },
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const BatchFileCard = ({ item, onRetry, onRemove, onDownload }: BatchFileCardProps) => {
  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all duration-300",
        item.status === "processing" && "border-primary/50 shadow-sm",
        item.status === "complete" && "border-green-500/30",
        item.status === "error" && "border-destructive/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              item.status === "pending" && "bg-muted",
              item.status === "processing" && "bg-primary/10",
              item.status === "complete" && "bg-green-500/10",
              item.status === "error" && "bg-destructive/10"
            )}
          >
            <StatusIcon
              className={cn(
                "h-5 w-5",
                config.color,
                item.status === "processing" && "animate-spin"
              )}
            />
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{item.file.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatSize(item.file.size)}</span>
              <span>•</span>
              <span className={config.color}>{config.label}</span>
              {item.status === "complete" && item.result && (
                <>
                  <span>•</span>
                  <span className="text-green-500">
                    → {formatSize(item.result.size)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {item.status === "error" && (
            <Button variant="ghost" size="icon" onClick={() => onRetry(item.id)} title="Retry">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          {item.status === "complete" && item.result && (
            <Button variant="ghost" size="icon" onClick={() => onDownload(item)} title="Download">
              <Download className="h-4 w-4 text-green-500" />
            </Button>
          )}
          {(item.status === "pending" || item.status === "error") && (
            <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} title="Remove">
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(item.status === "processing" || item.status === "complete") && (
        <div className="mt-3">
          <Progress
            value={item.progress}
            className={cn(
              "h-2",
              item.status === "complete" && "[&>div]:bg-green-500"
            )}
          />
        </div>
      )}

      {/* Error Message */}
      {item.status === "error" && item.error && (
        <p className="mt-2 text-xs text-destructive">{item.error}</p>
      )}
    </div>
  );
};

export default BatchFileCard;
