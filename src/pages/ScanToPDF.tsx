import { Camera } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";

const ScanToPDF = () => {
  return (
    <ToolLayout
      title="Scan to PDF"
      description="Scan documents using your camera and convert to PDF"
      icon={Camera}
      color="image"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Coming Soon:</strong> Scan to PDF requires camera access and advanced image processing.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          This feature will be available in a future update. For now, you can use <strong>Image to PDF</strong> to convert photos of documents.
        </p>
      </div>
    </ToolLayout>
  );
};

export default ScanToPDF;
