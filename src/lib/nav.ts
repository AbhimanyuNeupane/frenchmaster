import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  SpellCheck2,
  Headphones,
  Mic,
  BookText,
  PenLine,
  Dumbbell,
  GraduationCap,
  Trophy,
  Award,
  LineChart,
  Settings,
  User,
} from "lucide-react";

import type { NavKey } from "@/types";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "learn", label: "Learn", href: "/learn", icon: BookOpen },
  { key: "vocabulary", label: "Vocabulary", href: "/vocabulary", icon: Library },
  { key: "grammar", label: "Grammar", href: "/grammar", icon: SpellCheck2 },
  { key: "listening", label: "Listening", href: "/listening", icon: Headphones },
  { key: "speaking", label: "Speaking", href: "/speaking", icon: Mic },
  { key: "reading", label: "Reading", href: "/reading", icon: BookText },
  { key: "writing", label: "Writing", href: "/writing", icon: PenLine },
  { key: "practice", label: "Practice", href: "/practice", icon: Dumbbell },
  { key: "exam", label: "Exam", href: "/exam", icon: GraduationCap },
];

export const secondaryNav: NavItem[] = [
  { key: "achievements", label: "Achievements", href: "/achievements", icon: Trophy },
  { key: "certificates", label: "Certificates", href: "/certificates", icon: Award },
  { key: "progress", label: "Progress", href: "/progress", icon: LineChart },
];

export const utilityNav: NavItem[] = [
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
  { key: "profile", label: "Profile", href: "/profile", icon: User },
];

export const allNav = [...primaryNav, ...secondaryNav, ...utilityNav];
