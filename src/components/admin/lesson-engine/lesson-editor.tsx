"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Upload,
  Download,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminTextarea } from "@/components/admin/form-controls";
import { LessonPreviewPanel } from "@/components/admin/lesson-engine/lesson-preview-panel";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import { triggerBlobDownload } from "@/lib/download";
import { lessonSchema } from "@/lesson-engine/services/content/schema";
import type { ZodError } from "zod";
import type { Lesson, LessonCard } from "@/lesson-engine/types";
import type {
  AdminLessonEngineLessonDetail,
  ValidateLessonDraftResponse,
} from "@/types/lessonEngineAdmin";

const STARTER_CARDS = `[
  {
    "id": "c1",
    "type": "TextCard",
    "title": "Welcome",
    "content": {
      "body": "Write your lesson introduction here."
    }
  }
]`;

/** Result of attempting to parse the cards textarea. */
interface ParsedCards {
  cards: unknown[];
  error: string | null;
}

function parseCardsText(text: string): ParsedCards {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { cards: [], error: e instanceof Error ? e.message : "Invalid JSON." };
  }
  if (!Array.isArray(value)) {
    return { cards: [], error: "Cards must be a JSON array." };
  }
  return { cards: value, error: null };
}

/** Flattens Zod issues into `path: message` strings for display. */
function formatIssues(error: ZodError): string[] {
  return error.issues.map(
    (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
  );
}

export function LessonEditor({
  lesson,
}: {
  lesson?: AdminLessonEngineLessonDetail;
}) {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const isEditing = lesson !== undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState(lesson?.id ?? "");
  const [language, setLanguage] = useState(lesson?.language ?? "");
  const [level, setLevel] = useState(lesson?.level ?? "");
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [published, setPublished] = useState(lesson?.published ?? false);
  const [cardsText, setCardsText] = useState(
    lesson ? JSON.stringify(lesson.cards, null, 2) : STARTER_CARDS
  );

  const [cardsParseError, setCardsParseError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation results (client-strict + server-structural), shown together.
  const [clientIssues, setClientIssues] = useState<string[] | null>(null);
  const [serverResult, setServerResult] = useState<ValidateLessonDraftResponse | null>(
    null
  );
  const [validating, setValidating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);

  // Live parse of the cards textarea, recomputed only when the text changes.
  const parsed = useMemo(() => parseCardsText(cardsText), [cardsText]);

  // A preview is only assembled once the cards at least parse as a JSON array.
  const previewLesson = useMemo<Lesson | null>(() => {
    if (parsed.error) return null;
    return {
      id: id.trim() || "preview",
      language: language.trim() || "xx",
      level: level.trim() || "A1",
      title: title.trim() || "Untitled lesson",
      description: description.trim() || undefined,
      cards: parsed.cards as LessonCard[],
    };
  }, [parsed, id, language, level, title, description]);

  /** Clears any stale validation output whenever the draft changes. */
  function invalidateResults() {
    setClientIssues(null);
    setServerResult(null);
  }

  function handleFormat() {
    const result = parseCardsText(cardsText);
    if (result.error) {
      setCardsParseError(result.error);
      return;
    }
    setCardsParseError(null);
    setCardsText(JSON.stringify(result.cards, null, 2));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange again.
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    let value: unknown;
    try {
      value = JSON.parse(await file.text());
    } catch {
      setUploadError("That file isn't valid JSON.");
      return;
    }

    // A bare array → only the cards textarea; metadata is left untouched.
    if (Array.isArray(value)) {
      setCardsText(JSON.stringify(value, null, 2));
      setCardsParseError(null);
      invalidateResults();
      return;
    }

    // A full lesson object (has a top-level `cards` array) → populate everything.
    if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).cards)) {
      const obj = value as Record<string, unknown>;
      // id is immutable in edit mode — never overwrite it from an upload.
      if (!isEditing && typeof obj.id === "string") setId(obj.id);
      if (typeof obj.language === "string") setLanguage(obj.language);
      if (typeof obj.level === "string") setLevel(obj.level);
      if (typeof obj.title === "string") setTitle(obj.title);
      if (typeof obj.description === "string") setDescription(obj.description);
      setCardsText(JSON.stringify(obj.cards, null, 2));
      setCardsParseError(null);
      invalidateResults();
      return;
    }

    setUploadError(
      "Expected a lesson object with a `cards` array, or a bare cards array."
    );
  }

  function handleDownload() {
    const result = parseCardsText(cardsText);
    if (result.error) {
      setCardsParseError(result.error);
      return;
    }
    setCardsParseError(null);
    const payload = {
      id: id.trim(),
      language: language.trim(),
      level: level.trim(),
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      cards: result.cards,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    triggerBlobDownload(blob, `${id.trim() || "lesson"}.json`);
  }

  /** Assembles the draft for schema validation (client) — id included as-is. */
  function assembleDraft(cards: unknown[]): Record<string, unknown> {
    return {
      id: id.trim(),
      language: language.trim(),
      level: level.trim(),
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      cards,
    };
  }

  async function handleValidate() {
    const result = parseCardsText(cardsText);
    if (result.error) {
      setCardsParseError(result.error);
      setClientIssues(null);
      setServerResult(null);
      return;
    }
    setCardsParseError(null);

    // 1) Client-side, strict: the engine's full per-card-type schema.
    const draft = assembleDraft(result.cards);
    const strict = lessonSchema.safeParse(draft);
    setClientIssues(strict.success ? [] : formatIssues(strict.error));

    // 2) Server-side, structural: catches anything server-specific (id format).
    setValidating(true);
    try {
      const body = {
        ...draft,
        // Send id only when present so the dry-run (id optional) doesn't flag
        // an empty id before the admin has chosen one.
        ...(id.trim() ? { id: id.trim() } : {}),
        published,
      };
      const res = await authedFetch<ValidateLessonDraftResponse>(
        "/api/admin/lesson-engine/lessons/validate",
        { method: "POST", body: JSON.stringify(body) }
      );
      setServerResult(res);
    } catch (err) {
      setServerResult({
        valid: false,
        errors: [
          err instanceof ApiRequestError
            ? err.message
            : "Server validation request failed.",
        ],
      });
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    setSaveError(null);

    const result = parseCardsText(cardsText);
    if (result.error) {
      setCardsParseError(result.error);
      setSaveError("Fix the cards JSON before saving.");
      return;
    }
    setCardsParseError(null);

    // Never let obviously-broken content reach the server: run the strict
    // client schema as a gate before Save.
    const draft = assembleDraft(result.cards);
    const strict = lessonSchema.safeParse(draft);
    if (!strict.success) {
      setClientIssues(formatIssues(strict.error));
      setSaveError("This lesson has validation issues — see the results below.");
      return;
    }

    if (!isEditing && !id.trim()) {
      setSaveError("A lesson id is required.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await authedFetch(`/api/admin/lesson-engine/lessons/${lesson.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            language: language.trim(),
            level: level.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            cards: result.cards,
            published,
          }),
        });
      } else {
        await authedFetch("/api/admin/lesson-engine/lessons", {
          method: "POST",
          body: JSON.stringify({
            id: id.trim(),
            language: language.trim(),
            level: level.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            cards: result.cards,
            published,
          }),
        });
      }
      router.push("/admin/lesson-engine");
    } catch (err) {
      setSaveError(
        err instanceof ApiRequestError ? err.message : "Failed to save lesson."
      );
    } finally {
      setSaving(false);
    }
  }

  const clientOk = clientIssues !== null && clientIssues.length === 0;
  const serverOk = serverResult !== null && serverResult.valid;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground"
            >
              <Link href="/admin/lesson-engine">
                <ArrowLeft className="size-4" />
                Back to lessons
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              {isEditing ? "Edit lesson" : "New lesson"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing
                ? "Update this lesson's metadata and card content."
                : "Author a new card-based lesson for the lesson player."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Upload
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="size-4" />
              Download
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleUpload}
              className="hidden"
            />
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEditing ? "Save changes" : "Create lesson"}
            </Button>
          </div>
        </div>
        {uploadError && <p className="mt-2 text-sm text-danger">{uploadError}</p>}
        {saveError && <p className="mt-2 text-sm text-danger">{saveError}</p>}
      </Reveal>

      {/* Metadata */}
      <Reveal delay={0.03}>
        <Card className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="lesson-id">Lesson id</Label>
              <Input
                id="lesson-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="fr_a1_lesson_002"
                disabled={isEditing}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isEditing
                  ? "The id is permanent and can't be changed after creation."
                  : "Letters, numbers, underscore, hyphen. Permanent once created."}
              </p>
            </div>
            <div>
              <Label htmlFor="lesson-language">Language</Label>
              <Input
                id="lesson-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="fr"
              />
            </div>
            <div>
              <Label htmlFor="lesson-level">Level</Label>
              <Input
                id="lesson-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="A1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Greetings & Politeness"
            />
          </div>

          <div>
            <Label htmlFor="lesson-description">Description (optional)</Label>
            <AdminTextarea
              id="lesson-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Say hello, goodbye, and be polite in everyday French."
              className="min-h-[64px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy">
                {published ? "Published" : "Draft"}
              </p>
              <p className="text-xs text-muted-foreground">
                Published lessons are visible to learners via the public API.
              </p>
            </div>
            <Button
              variant={published ? "accent" : "outline"}
              size="sm"
              onClick={() => setPublished((p) => !p)}
            >
              {published ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </Card>
      </Reveal>

      {/* Cards editor + actions */}
      <Reveal delay={0.05}>
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label htmlFor="lesson-cards">Cards (JSON array)</Label>
              <p className="text-xs text-muted-foreground">
                Each card is <span className="font-mono">{"{ id, type, content, … }"}</span>.
                Validate before saving to catch shape errors.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFormat}>
                <Wand2 className="size-3.5" />
                Format
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidate}
                disabled={validating}
              >
                {validating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Validate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((p) => !p)}
                disabled={Boolean(parsed.error)}
                title={parsed.error ? "Fix the cards JSON to enable preview." : undefined}
              >
                {showPreview ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {showPreview ? "Hide preview" : "Preview"}
              </Button>
            </div>
          </div>

          <AdminTextarea
            id="lesson-cards"
            value={cardsText}
            onChange={(e) => {
              setCardsText(e.target.value);
              setCardsParseError(null);
              invalidateResults();
            }}
            spellCheck={false}
            className="min-h-[420px] font-mono text-xs leading-relaxed"
          />

          {parsed.error && (
            <p className="text-sm text-danger">
              Cards JSON is invalid: {parsed.error}
            </p>
          )}
          {cardsParseError && !parsed.error && (
            <p className="text-sm text-danger">{cardsParseError}</p>
          )}

          {/* Combined validation results */}
          {(clientIssues !== null || serverResult !== null) && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4">
              {clientIssues !== null && (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    {clientOk ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 text-danger" />
                    )}
                    Client schema (strict, all card types)
                  </p>
                  {clientOk ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Passes the full lesson-engine schema.
                    </p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {clientIssues.map((issue, i) => (
                        <li key={i} className="text-xs text-danger">
                          <span className="font-mono">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {serverResult !== null && (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    {serverOk ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 text-danger" />
                    )}
                    Server structural check
                  </p>
                  {serverOk ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Passes the backend&apos;s structural validation.
                    </p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {serverResult.errors.map((issue, i) => (
                        <li key={i} className="text-xs text-danger">
                          <span className="font-mono">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </Reveal>

      {/* Preview panel */}
      {showPreview && previewLesson && (
        <Reveal delay={0.05}>
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-navy">Live preview</h2>
              <p className="text-xs text-muted-foreground">
                Plays the current draft with the real lesson engine. Progress here
                is throwaway and isn&apos;t saved.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 sm:p-6">
              <LessonPreviewPanel lesson={previewLesson} />
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
