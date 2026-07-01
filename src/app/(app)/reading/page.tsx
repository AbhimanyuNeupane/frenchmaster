import { BookText } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function ReadingPage() {
  return (
    <ComingSoon
      icon={BookText}
      title="Reading Practice"
      description="Passages with vocabulary highlighting, translation toggle, and audio support are coming here."
    />
  );
}
