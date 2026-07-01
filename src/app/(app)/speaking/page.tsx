import { Mic } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function SpeakingPage() {
  return (
    <ComingSoon
      icon={Mic}
      title="Speaking Practice"
      description="Record yourself, get pronunciation scoring, and track your speaking history here."
    />
  );
}
