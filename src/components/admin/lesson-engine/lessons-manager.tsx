"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageError } from "@/components/layout/page-state";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminSelect } from "@/components/admin/form-controls";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type {
  AdminLessonEngineListResponse,
  AdminLessonEngineLessonSummary,
} from "@/types/lessonEngineAdmin";

const PAGE_SIZE = 20;

type PublishedFilter = "all" | "published" | "draft";

export function LessonsManager() {
  const { authedFetch } = useAuth();

  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("all");

  // Optimistic overlay for the inline publish/unpublish toggle: keyed by lesson
  // id, applied over the fetched value so the row flips instantly. Cleared on a
  // failed toggle (revert); harmless once refetched (it matches the server).
  const [publishOverride, setPublishOverride] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<AdminLessonEngineLessonSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const path = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (language.trim()) params.set("language", language.trim());
    if (level.trim()) params.set("level", level.trim());
    if (publishedFilter !== "all") {
      params.set("published", publishedFilter === "published" ? "true" : "false");
    }
    return `/api/admin/lesson-engine/lessons?${params.toString()}`;
  }, [page, language, level, publishedFilter]);

  const { data, isLoading, error, refetch } =
    useApiQuery<AdminLessonEngineListResponse>(path, [path]);

  const lessons = data?.lessons ?? [];

  function resetToFirstPage() {
    setPage(1);
  }

  function isPublished(lesson: AdminLessonEngineLessonSummary): boolean {
    return publishOverride[lesson.id] ?? lesson.published;
  }

  async function togglePublished(lesson: AdminLessonEngineLessonSummary) {
    const next = !isPublished(lesson);
    setTogglingId(lesson.id);
    setToolbarError(null);
    setPublishOverride((prev) => ({ ...prev, [lesson.id]: next }));
    try {
      await authedFetch(`/api/admin/lesson-engine/lessons/${lesson.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: next }),
      });
      refetch();
    } catch (err) {
      // Revert the optimistic flip.
      setPublishOverride((prev) => {
        const next = { ...prev };
        delete next[lesson.id];
        return next;
      });
      setToolbarError(
        err instanceof ApiRequestError ? err.message : "Failed to update lesson."
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await authedFetch(`/api/admin/lesson-engine/lessons/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      // Stepping back a page if we just removed the last row on a later page.
      if (lessons.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (err) {
      setDeleteError(
        err instanceof ApiRequestError ? err.message : "Failed to delete lesson."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              Lesson Engine
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Author card-based lessons for the universal lesson player.
            </p>
          </div>
          <Button asChild variant="accent" className="w-full sm:w-auto">
            <Link href="/admin/lesson-engine/new">
              <Plus className="size-4" />
              New lesson
            </Link>
          </Button>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal delay={0.03}>
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="filter-language">Language</Label>
            <Input
              id="filter-language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                resetToFirstPage();
              }}
              placeholder="e.g. fr"
            />
          </div>
          <div>
            <Label htmlFor="filter-level">Level</Label>
            <Input
              id="filter-level"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                resetToFirstPage();
              }}
              placeholder="e.g. A1"
            />
          </div>
          <div>
            <Label htmlFor="filter-published">Status</Label>
            <AdminSelect
              id="filter-published"
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value as PublishedFilter);
                resetToFirstPage();
              }}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </AdminSelect>
          </div>
        </div>
      </Reveal>

      {toolbarError && <p className="text-sm text-danger">{toolbarError}</p>}

      {error ? (
        <PageError message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Layers className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No lessons yet</p>
          <p className="text-xs text-muted-foreground">
            Create the first lesson to start building the course library.
          </p>
          <Button asChild variant="accent" size="sm" className="mt-2">
            <Link href="/admin/lesson-engine/new">
              <Plus className="size-4" />
              New lesson
            </Link>
          </Button>
        </div>
      ) : (
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {lessons.map((lesson) => {
              const published = isPublished(lesson);
              return (
                <Card
                  key={lesson.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-navy">{lesson.title}</p>
                      <Badge variant="outline">{lesson.language}</Badge>
                      <Badge variant="accent">{lesson.level}</Badge>
                      <Badge variant={published ? "accent" : "outline"}>
                        {published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{lesson.id}</span> ·{" "}
                      {lesson.cardCount} card{lesson.cardCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(lesson)}
                      disabled={togglingId === lesson.id}
                    >
                      {togglingId === lesson.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : published ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      {published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/lesson-engine/${lesson.id}`}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(lesson);
                      }}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Reveal>
      )}

      {data && data.lessons.length > 0 && (
        <PaginationControls
          pagination={data.pagination}
          onPageChange={setPage}
          disabled={isLoading}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        destructive
        loading={deleting}
        title="Delete this lesson?"
        description={
          deleteError
            ? deleteError
            : `"${deleteTarget?.title}" will be removed from the library. Learner progress history is preserved.`
        }
        confirmLabel="Delete lesson"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
