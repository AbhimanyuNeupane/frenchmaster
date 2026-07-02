import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-white">
          <GraduationCap className="size-5" strokeWidth={2.25} />
        </span>
        <span className="text-lg font-bold tracking-tight text-navy">FrenchMaster</span>
      </Link>
      <div className="w-full max-w-md animate-fade-in">{children}</div>
    </div>
  );
}
