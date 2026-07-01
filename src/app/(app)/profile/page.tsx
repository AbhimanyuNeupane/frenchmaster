import { User } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProfilePage() {
  return (
    <ComingSoon
      icon={User}
      title="Profile"
      description="Your public profile, learning history, and account details are coming here."
    />
  );
}
