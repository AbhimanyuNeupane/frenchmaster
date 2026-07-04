"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminSelect } from "@/components/admin/form-controls";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import {
  VOCABULARY_CATEGORY_ICONS,
  resolveCategoryIcon,
} from "@/lib/vocabulary-category-icons";
import type { AdminVocabularyCategory } from "@/types/admin";

/**
 * Admin control surface for the learner-facing vocabulary category tiles'
 * icon and display order. Every row auto-saves on change (matches the
 * inline-PATCH-on-toggle pattern already used in the Languages manager) —
 * there's no separate "Save" step, since each field is independently valid
 * the moment it's set.
 */
export function VocabularyCategoriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { authedFetch } = useAuth();
  const [categories, setCategories] = useState<AdminVocabularyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    authedFetch<AdminVocabularyCategory[]>("/api/admin/vocabulary/categories")
      .then(setCategories)
      .catch((err) => {
        setLoadError(err instanceof ApiRequestError ? err.message : "Failed to load categories.");
      })
      .finally(() => setLoading(false));
  }, [open, authedFetch]);

  async function save(name: string, patch: { icon?: string; displayOrder?: number }) {
    setSavingName(name);
    setRowErrors((prev) => ({ ...prev, [name]: "" }));
    // Optimistic update.
    setCategories((prev) =>
      prev.map((c) => (c.name === name ? { ...c, ...patch, managed: true } : c))
    );
    try {
      const updated = await authedFetch<AdminVocabularyCategory>(
        `/api/admin/vocabulary/categories/${encodeURIComponent(name)}`,
        { method: "PATCH", body: JSON.stringify(patch) }
      );
      setCategories((prev) => prev.map((c) => (c.name === name ? updated : c)));
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [name]: err instanceof ApiRequestError ? err.message : "Failed to save.",
      }));
    } finally {
      setSavingName(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vocabulary categories</DialogTitle>
          <DialogDescription>
            Control the icon and display order learners see for each category. Changes save
            immediately and apply everywhere the category is shown.
          </DialogDescription>
        </DialogHeader>

        {loadError && <p className="text-sm text-danger">{loadError}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const Icon = resolveCategoryIcon(cat.icon);
              const saving = savingName === cat.name;
              return (
                <div
                  key={cat.name}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.wordCount} {cat.wordCount === 1 ? "word" : "words"}
                    </p>
                  </div>
                  <div className="w-full sm:w-40">
                    <AdminSelect
                      aria-label={`Icon for ${cat.name}`}
                      value={cat.icon}
                      disabled={saving}
                      onChange={(e) => save(cat.name, { icon: e.target.value })}
                    >
                      {VOCABULARY_CATEGORY_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </AdminSelect>
                  </div>
                  <div className="w-full sm:w-24">
                    <Input
                      type="number"
                      aria-label={`Display order for ${cat.name}`}
                      value={cat.displayOrder}
                      disabled={saving}
                      onChange={(e) =>
                        setCategories((prev) =>
                          prev.map((c) =>
                            c.name === cat.name
                              ? { ...c, displayOrder: Number(e.target.value) }
                              : c
                          )
                        )
                      }
                      onBlur={(e) => save(cat.name, { displayOrder: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex w-6 shrink-0 items-center justify-center">
                    {saving ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Check className="size-4 text-success opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                  {rowErrors[cat.name] && (
                    <p className="text-xs text-danger sm:w-full">{rowErrors[cat.name]}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
