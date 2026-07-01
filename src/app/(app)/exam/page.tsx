import { GraduationCap } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function ExamPage() {
  return (
    <ComingSoon
      icon={GraduationCap}
      title="Exam Mode"
      description="DELF-style A1–B2 exams with listening, speaking, reading, and writing sections are coming here."
    />
  );
}
