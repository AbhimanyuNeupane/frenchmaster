import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, Library, Globe, BookOpen, CreditCard, Layers, ShieldCheck } from "lucide-react";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, the link is only active on an exact path match (used for the index route). */
  exact?: boolean;
}

/** Sections backed by real endpoints. Do not add items here until the backend supports them. */
export const adminNav: AdminNavItem[] = [
  { key: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { key: "users", label: "Users", href: "/admin/users", icon: Users },
  { key: "roles", label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
  { key: "vocabulary", label: "Vocabulary", href: "/admin/vocabulary", icon: Library },
  { key: "lesson-engine", label: "Lesson Engine", href: "/admin/lesson-engine", icon: Layers },
  { key: "languages", label: "Languages", href: "/admin/languages", icon: Globe },
];

/**
 * Obviously-expected sections that don't have backend support yet. Shown as
 * disabled "Soon" entries so the sidebar reads as a real console rather than a
 * two-item stub — but they are not routable.
 */
export const adminComingSoon: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "payments", label: "Payments", icon: CreditCard },
];

/** Whether `pathname` should mark `item` as the active nav entry. */
export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
