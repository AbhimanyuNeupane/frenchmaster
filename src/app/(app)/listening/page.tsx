import { Headphones } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function ListeningPage() {
  return (
    <ComingSoon
      icon={Headphones}
      title="Listening Practice"
      description="Audio exercises with fill-in-the-blank, true/false, and multiple choice questions are coming here."
    />
  );
}
