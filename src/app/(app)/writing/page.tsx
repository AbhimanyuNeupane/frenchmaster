import { PenLine } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function WritingPage() {
  return (
    <ComingSoon
      icon={PenLine}
      title="Writing Practice"
      description="Guided writing exercises with AI feedback on grammar and phrasing are coming here."
    />
  );
}
