"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  BookOpen,
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
import { EngineSubnav } from "@/components/admin/lesson-engine/engine-subnav";
import { AdminSelect } from "@/components/admin/form-controls";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type {
  AdminLessonEngineCourseListResponse,
  AdminLessonEngineCourseSummary,
} from "@/types/lessonEngineAdmin";

const PAGE_SIZE = 20;

type PublishedFilter = "all" | "published" | "draft";

export function CoursesManager() {
  const { authedFetch } = useAuth();

  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("all");

  // Optimistic overlay for the inline publish/unpublish toggle: keyed by course
  // id, applied over the fetched value so the row flips instantly.
  const [publishOverride, setPublishOverride] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<AdminLessonEngineCourseSummary | null>(null);
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
    return `/api/admin/lesson-engine/courses?${params.toString()}`;
  }, [page, language, level, publishedFilter]);

  const { data, isLoading, error, refetch } =
    useApiQuery<AdminLessonEngineCourseListResponse>(path, [path]);

  const courses = data?.courses ?? [];

  function resetToFirstPage() {
    setPage(1);
  }

  function isPublished(course: AdminLessonEngineCourseSummary): boolean {
    return publishOverride[course.id] ?? course.published;
  }

  async function togglePublished(course: AdminLessonEngineCourseSummary) {
    const next = !isPublished(course);
    setTogglingId(course.id);
    setToolbarError(null);
    setPublishOverride((prev) => ({ ...prev, [course.id]: next }));
    try {
      await authedFetch(`/api/admin/lesson-engine/courses/${course.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: next }),
      });
      refetch();
    } catch (err) {
      setPublishOverride((prev) => {
        const copy = { ...prev };
        delete copy[course.id];
        return copy;
      });
      setToolbarError(
        err instanceof ApiRequestError ? err.message : "Failed to update course."
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
      await authedFetch(`/api/admin/lesson-engine/courses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      if (courses.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (err) {
      setDeleteError(
        err instanceof ApiRequestError ? err.message : "Failed to delete course."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <EngineSubnav />
      </Reveal>
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Group lessons into ordered sections learners can work through.
            </p>
          </div>
          <Button asChild variant="accent" className="w-full sm:w-auto">
            <Link href="/admin/lesson-engine/courses/new">
              <Plus className="size-4" />
              New course
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
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No courses yet</p>
          <p className="text-xs text-muted-foreground">
            Create the first course to organize lessons into sections.
          </p>
          <Button asChild variant="accent" size="sm" className="mt-2">
            <Link href="/admin/lesson-engine/courses/new">
              <Plus className="size-4" />
              New course
            </Link>
          </Button>
        </div>
      ) : (
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const published = isPublished(course);
              return (
                <Card
                  key={course.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-navy">{course.title}</p>
                      <Badge variant="outline">{course.language}</Badge>
                      <Badge variant="accent">{course.level}</Badge>
                      <Badge variant={published ? "accent" : "outline"}>
                        {published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{course.id}</span> ·{" "}
                      {course.sectionCount} section
                      {course.sectionCount === 1 ? "" : "s"} · order{" "}
                      {course.displayOrder}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(course)}
                      disabled={togglingId === course.id}
                    >
                      {togglingId === course.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : published ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      {published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/lesson-engine/courses/${course.id}`}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(course);
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

      {data && data.courses.length > 0 && (
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
        title="Delete this course?"
        description={
          deleteError
            ? deleteError
            : `"${deleteTarget?.title}" will be removed. The lessons inside it are not deleted — only the course grouping is.`
        }
        confirmLabel="Delete course"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
