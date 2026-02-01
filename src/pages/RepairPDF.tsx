import { Wrench } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";

const RepairPDF = () => {
  return (
    <ToolLayout
      title="Repair PDF"
      description="Fix corrupted or damaged PDF files"
      icon={Wrench}
      color="compress"
    >
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <p className="text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> PDF repair requires advanced server-side processing
          and is not available in the client-side version.
        </p>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Enable Lovable Cloud for this feature.
        </p>
      </div>
    </ToolLayout>
  );
};

export default RepairPDF;
