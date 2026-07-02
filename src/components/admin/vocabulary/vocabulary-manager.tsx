"use client";

import { useMemo, useState } from "react";
import { Loader2, Library, Plus, Pencil, Trash2 } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageError } from "@/components/layout/page-state";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { VocabularyFormDialog } from "@/components/admin/vocabulary/vocabulary-form-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminVocabularyListResponse, AdminVocabularyWord } from "@/types/admin";

const PAGE_SIZE = 20;

export function VocabularyManager() {
  const { authedFetch } = useAuth();

  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [activeWord, setActiveWord] = useState<AdminVocabularyWord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminVocabularyWord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
          <Button variant="accent" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add word
          </Button>
        </div>
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
                  <p className="mt-1 truncate text-sm text-muted-foreground">{word.english}</p>
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
