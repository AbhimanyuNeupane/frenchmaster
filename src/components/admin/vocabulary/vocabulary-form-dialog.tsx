"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

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
import { AdminSelect, AdminTextarea } from "@/components/admin/form-controls";
import { SynonymsInput } from "@/components/admin/vocabulary/synonyms-input";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type { CEFRLevel, PartOfSpeech, WordGender } from "@/types";
import type { AdminVocabularyWord, VocabularyWordPayload } from "@/types/admin";
import type { AdminLanguage } from "@/types/language";

const PARTS_OF_SPEECH: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "expression",
];
const GENDERS: WordGender[] = ["masculine", "feminine", "neutral"];
const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

/** A non-English translation row in the editor. */
interface TranslationRow {
  languageCode: string;
  text: string;
}

interface FormState {
  french: string;
  english: string;
  extraTranslations: TranslationRow[];
  gender: WordGender | "none";
  partOfSpeech: PartOfSpeech;
  pronunciationIpa: string;
  audioUrl: string;
  exampleFr: string;
  exampleEn: string;
  imageUrl: string;
  synonyms: string[];
  commonMistake: string;
  level: CEFRLevel;
  unitTitle: string;
}

const EMPTY_FORM: FormState = {
  french: "",
  english: "",
  extraTranslations: [],
  gender: "none",
  partOfSpeech: "noun",
  pronunciationIpa: "",
  audioUrl: "",
  exampleFr: "",
  exampleEn: "",
  imageUrl: "",
  synonyms: [],
  commonMistake: "",
  level: "A1",
  unitTitle: "",
};

function toFormState(word: AdminVocabularyWord): FormState {
  const english = word.translations.find((t) => t.languageCode === "en")?.text ?? "";
  const extraTranslations = word.translations
    .filter((t) => t.languageCode !== "en")
    .map((t) => ({ languageCode: t.languageCode, text: t.text }));
  return {
    french: word.french,
    english,
    extraTranslations,
    gender: word.gender ?? "none",
    partOfSpeech: word.partOfSpeech,
    pronunciationIpa: word.pronunciationIpa,
    audioUrl: word.audioUrl ?? "",
    exampleFr: word.exampleFr,
    exampleEn: word.exampleEn,
    imageUrl: word.imageUrl ?? "",
    synonyms: word.synonyms,
    commonMistake: word.commonMistake ?? "",
    level: word.level,
    unitTitle: word.unitTitle,
  };
}

export function VocabularyFormDialog({
  word,
  open,
  onOpenChange,
  onSaved,
}: {
  word: AdminVocabularyWord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (word: AdminVocabularyWord) => void;
}) {
  const { authedFetch } = useAuth();
  const isEditing = word !== null;

  // All languages (incl. disabled) — an admin may pre-author content for a
  // language that isn't enabled for learners yet. English is pinned separately.
  const { data: languages } = useApiQuery<AdminLanguage[]>("/api/admin/languages");
  const otherLanguages = useMemo(
    () => (languages ?? []).filter((l) => l.code !== "en"),
    [languages]
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  // Populate the form once per open (create → empty, edit → the word's values).
  // Adjusting state during render is React's recommended pattern for resetting
  // state when props change, and avoids a cascading-render lint warning.
  if (open && !synced) {
    setSynced(true);
    setForm(word ? toFormState(word) : EMPTY_FORM);
    setError(null);
  } else if (!open && synced) {
    setSynced(false);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const usedCodes = form.extraTranslations.map((t) => t.languageCode);
  const firstUnusedCode = otherLanguages.find((l) => !usedCodes.includes(l.code))?.code;

  function addTranslation() {
    if (!firstUnusedCode) return;
    setForm((prev) => ({
      ...prev,
      extraTranslations: [...prev.extraTranslations, { languageCode: firstUnusedCode, text: "" }],
    }));
  }

  function updateTranslation(index: number, patch: Partial<TranslationRow>) {
    setForm((prev) => ({
      ...prev,
      extraTranslations: prev.extraTranslations.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));
  }

  function removeTranslation(index: number) {
    setForm((prev) => ({
      ...prev,
      extraTranslations: prev.extraTranslations.filter((_, i) => i !== index),
    }));
  }

  /** Options for a given row: unused languages plus the row's own current code. */
  function optionsForRow(currentCode: string): AdminLanguage[] {
    const opts = otherLanguages.filter(
      (l) => l.code === currentCode || !usedCodes.includes(l.code)
    );
    // Preserve a code that isn't in the fetched list (e.g. list still loading)
    // so the select doesn't silently blank out an existing translation.
    if (currentCode && !opts.some((l) => l.code === currentCode)) {
      return [
        {
          code: currentCode,
          name: currentCode.toUpperCase(),
          flagEmoji: "🌐",
          displayOrder: 0,
          isDefault: false,
          enabled: true,
          createdAt: "",
          updatedAt: "",
        },
        ...opts,
      ];
    }
    return opts;
  }

  function validate(): string | null {
    const required: [keyof FormState, string][] = [
      ["french", "French word"],
      ["english", "English translation"],
      ["pronunciationIpa", "Pronunciation (IPA)"],
      ["exampleFr", "French example"],
      ["exampleEn", "English example"],
      ["unitTitle", "Unit / category"],
    ];
    for (const [key, label] of required) {
      if (!String(form[key]).trim()) return `${label} is required.`;
    }
    // A translation row with a language but no text is almost certainly a
    // half-filled row — flag it rather than silently dropping it.
    for (const row of form.extraTranslations) {
      if (!row.text.trim()) {
        const lang = otherLanguages.find((l) => l.code === row.languageCode);
        return `Enter a translation for ${lang?.name ?? row.languageCode}, or remove that row.`;
      }
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

    const payload: VocabularyWordPayload = {
      french: form.french.trim(),
      translations: [
        { languageCode: "en", text: form.english.trim() },
        ...form.extraTranslations
          .filter((t) => t.text.trim())
          .map((t) => ({ languageCode: t.languageCode, text: t.text.trim() })),
      ],
      gender: form.gender === "none" ? null : form.gender,
      partOfSpeech: form.partOfSpeech,
      pronunciationIpa: form.pronunciationIpa.trim(),
      audioUrl: form.audioUrl.trim() || null,
      exampleFr: form.exampleFr.trim(),
      exampleEn: form.exampleEn.trim(),
      imageUrl: form.imageUrl.trim() || null,
      synonyms: form.synonyms,
      commonMistake: form.commonMistake.trim() || null,
      level: form.level,
      unitTitle: form.unitTitle.trim(),
    };

    setSaving(true);
    setError(null);
    try {
      const saved = await authedFetch<AdminVocabularyWord>(
        isEditing ? `/api/admin/vocabulary/${word!.id}` : "/api/admin/vocabulary",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save word.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit word" : "Add word"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this vocabulary entry."
              : "Add a new word to the vocabulary catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="vocab-french">French word</Label>
            <Input
              id="vocab-french"
              value={form.french}
              onChange={(e) => set("french", e.target.value)}
              placeholder="bonjour"
              disabled={saving}
            />
          </div>

          {/* Translations editor — English is required and pinned first. */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div>
              <Label htmlFor="vocab-english">English translation (required)</Label>
              <Input
                id="vocab-english"
                value={form.english}
                onChange={(e) => set("english", e.target.value)}
                placeholder="hello"
                disabled={saving}
              />
            </div>

            {form.extraTranslations.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="w-40 shrink-0">
                  <Label className="text-xs">Language</Label>
                  <AdminSelect
                    aria-label="Translation language"
                    value={row.languageCode}
                    onChange={(e) => updateTranslation(index, { languageCode: e.target.value })}
                    disabled={saving}
                  >
                    {optionsForRow(row.languageCode).map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flagEmoji} {l.name}
                        {l.enabled ? "" : " (disabled)"}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Translation</Label>
                  <Input
                    aria-label="Translation text"
                    value={row.text}
                    onChange={(e) => updateTranslation(index, { text: e.target.value })}
                    placeholder="translation"
                    disabled={saving}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove translation"
                  onClick={() => removeTranslation(index)}
                  disabled={saving}
                  className="mb-0.5 text-danger hover:bg-danger/10"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTranslation}
                disabled={saving || !firstUnusedCode}
              >
                <Plus className="size-3.5" />
                Add translation
              </Button>
              {otherLanguages.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Add languages in the Languages section to author more translations.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="vocab-pos">Part of speech</Label>
              <AdminSelect
                id="vocab-pos"
                value={form.partOfSpeech}
                onChange={(e) => set("partOfSpeech", e.target.value as PartOfSpeech)}
                disabled={saving}
              >
                {PARTS_OF_SPEECH.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <Label htmlFor="vocab-gender">Gender</Label>
              <AdminSelect
                id="vocab-gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as WordGender | "none")}
                disabled={saving}
              >
                <option value="none">None (non-noun)</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <Label htmlFor="vocab-level">Level</Label>
              <AdminSelect
                id="vocab-level"
                value={form.level}
                onChange={(e) => set("level", e.target.value as CEFRLevel)}
                disabled={saving}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vocab-ipa">Pronunciation (IPA)</Label>
              <Input
                id="vocab-ipa"
                value={form.pronunciationIpa}
                onChange={(e) => set("pronunciationIpa", e.target.value)}
                placeholder="/bɔ̃.ʒuʁ/"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="vocab-unit">Unit / category</Label>
              <Input
                id="vocab-unit"
                value={form.unitTitle}
                onChange={(e) => set("unitTitle", e.target.value)}
                placeholder="Greetings"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vocab-example-fr">French example</Label>
              <AdminTextarea
                id="vocab-example-fr"
                value={form.exampleFr}
                onChange={(e) => set("exampleFr", e.target.value)}
                placeholder="Bonjour, comment allez-vous ?"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="vocab-example-en">English example</Label>
              <AdminTextarea
                id="vocab-example-en"
                value={form.exampleEn}
                onChange={(e) => set("exampleEn", e.target.value)}
                placeholder="Hello, how are you?"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vocab-synonyms">Synonyms</Label>
            <SynonymsInput
              id="vocab-synonyms"
              value={form.synonyms}
              onChange={(next) => set("synonyms", next)}
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="vocab-mistake">Common mistake (optional)</Label>
            <AdminTextarea
              id="vocab-mistake"
              value={form.commonMistake}
              onChange={(e) => set("commonMistake", e.target.value)}
              placeholder="Learners often confuse this with 'bonsoir' (evening)."
              disabled={saving}
              className="min-h-[64px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vocab-audio">Audio URL (optional)</Label>
              <Input
                id="vocab-audio"
                type="url"
                value={form.audioUrl}
                onChange={(e) => set("audioUrl", e.target.value)}
                placeholder="https://…"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="vocab-image">Image URL (optional)</Label>
              <Input
                id="vocab-image"
                type="url"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://…"
                disabled={saving}
              />
            </div>
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
              {isEditing ? "Save changes" : "Add word"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
