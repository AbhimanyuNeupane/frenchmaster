import { BookOpen } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function LearnPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Structured Learning"
      description="Your A1–B2 course map with units and lessons is being built here."
    />
  );
}
