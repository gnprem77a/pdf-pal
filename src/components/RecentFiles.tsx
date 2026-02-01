import { Link } from "react-router-dom";
import { FileText, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentFiles } from "@/hooks/use-recent-files";

const RecentFiles = () => {
  const { recentFiles, clearRecentFiles } = useRecentFiles();

  if (recentFiles.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Recent Files</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentFiles}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {recentFiles.slice(0, 5).map((file, index) => (
            <Link
              key={`${file.name}-${index}`}
              to={file.toolPath}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.tool} • {formatSize(file.size)} • {formatTime(file.timestamp)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentFiles;
