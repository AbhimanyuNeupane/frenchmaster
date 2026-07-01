import { Dumbbell } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function PracticePage() {
  return (
    <ComingSoon
      icon={Dumbbell}
      title="Smart Review"
      description="Spaced-repetition review of your mistakes, weak topics, and due vocabulary is coming here."
    />
  );
}
