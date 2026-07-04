"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  Library,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Sparkles,
  Tags,
  X,
} from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageError } from "@/components/layout/page-state";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { VocabularyFormDialog } from "@/components/admin/vocabulary/vocabulary-form-dialog";
import { VocabularyImportDialog } from "@/components/admin/vocabulary/vocabulary-import-dialog";
import { VocabularyCategoriesDialog } from "@/components/admin/vocabulary/vocabulary-categories-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import { downloadAuthedFile } from "@/lib/download";
import type {
  AdminVocabularyListResponse,
  AdminVocabularyWord,
  AiTranslateBulkResponse,
  AiTranslateStatus,
} from "@/types/admin";

const PAGE_SIZE = 20;

/** English is guaranteed present on every catalog word; fall back defensively. */
function englishOf(word: AdminVocabularyWord): string {
  return word.translations.find((t) => t.languageCode === "en")?.text ?? "";
}

export function VocabularyManager() {
  const { authedFetch, authedFetchRaw } = useAuth();

  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [activeWord, setActiveWord] = useState<AdminVocabularyWord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminVocabularyWord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<AiTranslateBulkResponse | null>(null);

  // Whether AI translation is configured on the backend. When it isn't, the
  // bulk button is shown disabled with an explanatory tooltip rather than
  // failing on click.
  const { data: aiStatus, isLoading: aiStatusLoading } =
    useApiQuery<AiTranslateStatus>("/api/admin/vocabulary/ai-translate/status");
  const aiConfigured = aiStatus?.configured === true;
  const aiDisabledReason: string | null = aiStatusLoading
    ? "Checking AI availability…"
    : !aiConfigured
      ? "AI translation isn't set up yet."
      : null;

  const path = useMemo(
    () => `/api/admin/vocabulary?page=${page}&pageSize=${PAGE_SIZE}`,
    [page]
  );

  const { data, isLoading, error, refetch } = useApiQuery<AdminVocabularyListResponse>(path, [
    path,
  ]);

  const words = data?.words ?? [];

  function openCreate() {
    setActiveWord(null);
    setFormOpen(true);
  }

  function openEdit(word: AdminVocabularyWord) {
    setActiveWord(word);
    setFormOpen(true);
  }

  async function handleExport() {
    setExporting(true);
    setToolbarError(null);
    try {
      await downloadAuthedFile(
        authedFetchRaw,
        "/api/admin/vocabulary/export",
        "vocabulary-export.csv"
      );
    } catch (err) {
      setToolbarError(err instanceof ApiRequestError ? err.message : "Failed to export catalog.");
    } finally {
      setExporting(false);
    }
  }

  async function handleBulkFill() {
    setBulkRunning(true);
    setToolbarError(null);
    setBulkResult(null);
    try {
      // No body → the server fills every enabled language missing a
      // translation, up to its default limit of 20 words.
      const result = await authedFetch<AiTranslateBulkResponse>(
        "/api/admin/vocabulary/ai-translate-bulk",
        { method: "POST", body: JSON.stringify({}) }
      );
      setBulkResult(result);
      // Reflect the newly written translations in the visible list.
      refetch();
    } catch (err) {
      setToolbarError(
        err instanceof ApiRequestError ? err.message : "Failed to fill translations with AI."
      );
    } finally {
      setBulkRunning(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await authedFetch(`/api/admin/vocabulary/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      // If we just removed the last item on a page past the first, step back.
      if (words.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete word.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Vocabulary</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Author and manage the words in the learning catalog.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {aiDisabledReason ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="w-full sm:w-auto">
                    <Button variant="outline" disabled className="w-full sm:w-auto">
                      <Sparkles className="size-4" />
                      Fill missing with AI
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{aiDisabledReason}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                onClick={handleBulkFill}
                disabled={bulkRunning}
                className="w-full sm:w-auto"
              >
                {bulkRunning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Fill missing with AI
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="w-full sm:w-auto"
            >
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="w-full sm:w-auto"
            >
              <Upload className="size-4" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setCategoriesOpen(true)}
              className="w-full sm:w-auto"
            >
              <Tags className="size-4" />
              Manage categories
            </Button>
            <Button variant="accent" onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Add word
            </Button>
          </div>
        </div>
        {toolbarError && <p className="mt-2 text-sm text-danger">{toolbarError}</p>}

        {bulkResult && (
          <div className="mt-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-navy">
                  Filled {bulkResult.translationsAdded} translation
                  {bulkResult.translationsAdded === 1 ? "" : "s"} across{" "}
                  {bulkResult.wordsProcessed} word
                  {bulkResult.wordsProcessed === 1 ? "" : "s"}.
                </p>
                {bulkResult.errors.length > 0 && (
                  <ul className="mt-1.5 list-disc pl-5 text-xs text-danger">
                    {bulkResult.errors.map((e) => (
                      <li key={e.wordId}>
                        Word {e.wordId}: {e.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBulkResult(null)}
                aria-label="Dismiss"
                className="shrink-0 text-muted-foreground transition-colors hover:text-navy"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Reveal>

      {error ? (
        <PageError message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : words.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Library className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No vocabulary words yet</p>
          <p className="text-xs text-muted-foreground">
            Add the first word to start building the catalog.
          </p>
          <Button variant="accent" size="sm" onClick={openCreate} className="mt-2">
            <Plus className="size-4" />
            Add word
          </Button>
        </div>
      ) : (
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {words.map((word) => (
              <Card
                key={word.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-navy">{word.french}</p>
                    <Badge variant="outline">{word.partOfSpeech}</Badge>
                    {word.gender && <Badge variant="outline">{word.gender}</Badge>}
                    <Badge variant="accent">{word.level}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{englishOf(word)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{word.unitTitle}</p>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEdit(word)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(word);
                    }}
                    className="text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      )}

      {data && data.words.length > 0 && (
        <PaginationControls
          pagination={data.pagination}
          onPageChange={setPage}
          disabled={isLoading}
        />
      )}

      <VocabularyFormDialog
        word={activeWord}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => refetch()}
      />

      <VocabularyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setPage(1);
          refetch();
        }}
      />

      <VocabularyCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        destructive
        loading={deleting}
        title="Delete this word?"
        description={
          deleteError
            ? deleteError
            : `"${deleteTarget?.french}" will be removed from the catalog. Learner progress history is preserved.`
        }
        confirmLabel="Delete word"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
