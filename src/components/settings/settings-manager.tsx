"use client";

import { useState } from "react";
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useLanguages } from "@/hooks/use-languages";
import { ApiRequestError } from "@/lib/api-client";

export function SettingsManager() {
  const { user, updatePrimaryLanguage } = useAuth();
  const { languages, isLoading: languagesLoading } = useLanguages();

  const currentLanguage = user?.primaryLanguage ?? "en";
  const [selected, setSelected] = useState(currentLanguage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Keep the select in sync if the user's language changes elsewhere (e.g. a
  // fresh session restore) while this page is mounted and untouched.
  const [syncedTo, setSyncedTo] = useState(currentLanguage);
  if (currentLanguage !== syncedTo) {
    setSyncedTo(currentLanguage);
    setSelected(currentLanguage);
  }

  const activeLanguage = languages.find((l) => l.code === currentLanguage);
  const hasChanges = selected !== currentLanguage;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePrimaryLanguage(selected);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update language.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="size-5 text-accent" />
              Primary language
            </CardTitle>
            <CardDescription>
              Vocabulary and lesson words are translated into this language alongside English.
              Choosing English shows no extra translation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3.5 py-3 text-sm">
              <span className="text-muted-foreground">Currently:</span>
              <span className="flex items-center gap-1.5 font-semibold text-navy">
                <span aria-hidden className="text-base leading-none">
                  {activeLanguage?.flagEmoji ?? "🌐"}
                </span>
                {activeLanguage?.name ?? currentLanguage.toUpperCase()}
              </span>
            </div>

            <div className="max-w-sm">
              <Label htmlFor="settings-language">Change language</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="settings-language"
                  value={selected}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setSaved(false);
                    setError(null);
                  }}
                  disabled={saving || languagesLoading}
                  className="flex h-11 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {languages.length > 0 ? (
                    languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flagEmoji} {l.name}
                      </option>
                    ))
                  ) : (
                    <option value={currentLanguage}>{currentLanguage.toUpperCase()}</option>
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {saved && !hasChanges && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <Check className="size-4" />
                Language updated.
              </p>
            )}

            <div>
              <Button
                variant="accent"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
