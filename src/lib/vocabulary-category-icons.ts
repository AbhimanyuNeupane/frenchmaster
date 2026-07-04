import type { LucideIcon } from "lucide-react";
import {
  Hand,
  HelpCircle,
  Users,
  Zap,
  Hash,
  CalendarDays,
  Clock,
  Palette,
  Home,
  UtensilsCrossed,
  MapPin,
  Sparkles,
  PersonStanding,
  Package,
  BookOpen,
  Globe,
  Star,
  Heart,
  Music,
  Tag,
} from "lucide-react";

/**
 * Curated icon-name allowlist for vocabulary category presentation — must
 * match `server/src/constants/vocabularyCategoryIcons.ts` exactly (that file
 * is the single source of truth the backend validates against; this is the
 * frontend's matching lookup from that same string key to an actual
 * component). Admin picks one of these in the categories manager; the
 * learner-facing tile grid renders whichever the admin chose.
 */
export const VOCABULARY_CATEGORY_ICONS = [
  "hand",
  "help-circle",
  "users",
  "zap",
  "hash",
  "calendar-days",
  "clock",
  "palette",
  "home",
  "utensils-crossed",
  "map-pin",
  "sparkles",
  "person-standing",
  "package",
  "book-open",
  "globe",
  "star",
  "heart",
  "music",
  "tag",
] as const;

export type VocabularyCategoryIcon = (typeof VOCABULARY_CATEGORY_ICONS)[number];

const ICON_COMPONENTS: Record<VocabularyCategoryIcon, LucideIcon> = {
  hand: Hand,
  "help-circle": HelpCircle,
  users: Users,
  zap: Zap,
  hash: Hash,
  "calendar-days": CalendarDays,
  clock: Clock,
  palette: Palette,
  home: Home,
  "utensils-crossed": UtensilsCrossed,
  "map-pin": MapPin,
  sparkles: Sparkles,
  "person-standing": PersonStanding,
  package: Package,
  "book-open": BookOpen,
  globe: Globe,
  star: Star,
  heart: Heart,
  music: Music,
  tag: Tag,
};

/** Resolves an icon-name string to its component, falling back to a generic
 *  tag icon for anything unrecognized (defensive — the value always comes
 *  from the backend, but never trust it blindly). */
export function resolveCategoryIcon(icon: string): LucideIcon {
  return ICON_COMPONENTS[icon as VocabularyCategoryIcon] ?? Tag;
}
