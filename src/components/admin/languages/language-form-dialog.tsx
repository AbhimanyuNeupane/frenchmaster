"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CreateLanguagePayload, UpdateLanguagePayload } from "@/types/admin";
import type { AdminLanguage } from "@/types/language";

interface FormState {
  code: string;
  name: string;
  flagEmoji: string;
  displayOrder: string; // kept as string for the number input; parsed on submit
  enabled: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  flagEmoji: "",
  displayOrder: "0",
  enabled: true,
};

function toFormState(language: AdminLanguage): FormState {
  return {
    code: language.code,
    name: language.name,
    flagEmoji: language.flagEmoji,
    displayOrder: String(language.displayOrder),
    enabled: language.enabled,
  };
}

export function LanguageFormDialog({
  language,
  open,
  onOpenChange,
  onSaved,
}: {
  language: AdminLanguage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { authedFetch } = useAuth();
  const isEditing = language !== null;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  if (open && !synced) {
    setSynced(true);
    setForm(language ? toFormState(language) : EMPTY_FORM);
    setError(null);
  } else if (!open && synced) {
    setSynced(false);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!isEditing) {
      const code = form.code.trim().toLowerCase();
      if (!code) return "Language code is required.";
      if (!/^[a-z-]{2,10}$/.test(code)) {
        return "Code must be 2–10 lowercase letters or hyphens (e.g. \"ne\", \"pt-br\").";
      }
    }
    if (!form.name.trim()) return "Name is required.";
    if (!form.flagEmoji.trim()) return "Flag emoji is required.";
    if (!Number.isInteger(Number(form.displayOrder))) {
      return "Display order must be a whole number.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        const payload: UpdateLanguagePayload = {
          name: form.name.trim(),
          flagEmoji: form.flagEmoji.trim(),
          displayOrder: Number(form.displayOrder),
          enabled: form.enabled,
        };
        await authedFetch(`/api/admin/languages/${language!.code}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateLanguagePayload = {
          code: form.code.trim().toLowerCase(),
          name: form.name.trim(),
          flagEmoji: form.flagEmoji.trim(),
          displayOrder: Number(form.displayOrder),
          enabled: form.enabled,
        };
        await authedFetch("/api/admin/languages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save language.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit language" : "Add language"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this language's display details."
              : "Add a language that vocabulary can be translated into."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="lang-code">Code</Label>
            <Input
              id="lang-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="ne"
              disabled={saving || isEditing}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isEditing
                ? "The code is permanent and can't be changed."
                : "Lowercase letters/hyphens, e.g. \"ne\", \"hi\", \"pt-br\". Permanent once created."}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label htmlFor="lang-name">Name</Label>
              <Input
                id="lang-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nepali"
                disabled={saving}
              />
            </div>
            <div className="w-24">
              <Label htmlFor="lang-flag">Flag</Label>
              <Input
                id="lang-flag"
                value={form.flagEmoji}
                onChange={(e) => set("flagEmoji", e.target.value)}
                placeholder="🇳🇵"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lang-order">Display order</Label>
            <Input
              id="lang-order"
              type="number"
              value={form.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
              disabled={saving}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Lower numbers appear first in language pickers.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-navy">Enabled</p>
              <p className="text-xs text-muted-foreground">
                Learners can pick this language when enabled.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.enabled}
              aria-label="Enabled"
              onClick={() => set("enabled", !form.enabled)}
              disabled={saving}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
                form.enabled ? "bg-success" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                  form.enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add language"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
