import { Settings } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Account, notification, audio, and privacy preferences are coming here."
    />
  );
}
