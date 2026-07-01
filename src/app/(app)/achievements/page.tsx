import { Trophy } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function AchievementsPage() {
  return (
    <ComingSoon
      icon={Trophy}
      title="Achievements"
      description="Your full badge collection — streaks, mastery badges, and milestones — is coming here."
    />
  );
}
