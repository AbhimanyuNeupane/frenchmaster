import { LineChart } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProgressPage() {
  return (
    <ComingSoon
      icon={LineChart}
      title="Progress"
      description="Detailed charts for fluency, skill scores, and study time over time are coming here."
    />
  );
}
