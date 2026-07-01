import { Award } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function CertificatesPage() {
  return (
    <ComingSoon
      icon={Award}
      title="Certificates"
      description="Downloadable, verifiable certificates for each completed level exam are coming here."
    />
  );
}
