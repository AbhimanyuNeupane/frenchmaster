"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminTextarea } from "@/components/admin/form-controls";
import { EngineSubnav } from "@/components/admin/lesson-engine/engine-subnav";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type {
  AdminLessonEngineCourseDetail,
  AdminLessonEngineLessonSummary,
  AdminLessonEngineListResponse,
  LessonEngineCoursePayload,
} from "@/types/lessonEngineAdmin";

// A single section as held in editor state. Lessons are referenced by id only
// (ordered), matching the backend write shape — index in `lessonIds` is display
// order within the section.
interface SectionState {
  id?: string;
  title: string;
  displayOrder: number;
  lessonIds: string[];
}

// A generous single-page pull of the admin lesson list — enough to pick from
// without building real pagination inside the picker (per the brief).
const LESSON_PICKER_PAGE_SIZE = 100;

export function CourseEditor({
  course,
}: {
  course?: AdminLessonEngineCourseDetail;
}) {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const isEditing = course !== undefined;

  const [id, setId] = useState(course?.id ?? "");
  const [language, setLanguage] = useState(course?.language ?? "");
  const [level, setLevel] = useState(course?.level ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [published, setPublished] = useState(course?.published ?? false);
  const [displayOrder, setDisplayOrder] = useState<number>(course?.displayOrder ?? 0);

  const [sections, setSections] = useState<SectionState[]>(() =>
    (course?.sections ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      displayOrder: s.displayOrder,
      lessonIds: s.lessons.map((l) => l.id),
    }))
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Full admin lesson list to pick from. Generous single page — no nested
  // pagination in the picker.
  const { data: lessonData, isLoading: lessonsLoading } =
    useApiQuery<AdminLessonEngineListResponse>(
      `/api/admin/lesson-engine/lessons?page=1&pageSize=${LESSON_PICKER_PAGE_SIZE}`,
      []
    );
  const availableLessons = useMemo(
    () => lessonData?.lessons ?? [],
    [lessonData]
  );

  // id -> lesson meta, merging the course's already-embedded lessons (so
  // assigned lessons render a title even if they fall outside the fetched page)
  // with the fresher fetched list.
  const lessonMetaById = useMemo(() => {
    const map = new Map<
      string,
      { title: string; language: string; level: string }
    >();
    for (const s of course?.sections ?? []) {
      for (const l of s.lessons) {
        map.set(l.id, { title: l.title, language: l.language, level: l.level });
      }
    }
    for (const l of availableLessons) {
      map.set(l.id, { title: l.title, language: l.language, level: l.level });
    }
    return map;
  }, [course, availableLessons]);

  function addSection() {
    setSections((prev) => [
      ...prev,
      { title: "", displayOrder: prev.length, lessonIds: [] },
    ]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSection(index: number, patch: Partial<SectionState>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addLessonToSection(index: number, lessonId: string) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.lessonIds.includes(lessonId)) return s;
        return { ...s, lessonIds: [...s.lessonIds, lessonId] };
      })
    );
  }

  function removeLessonFromSection(index: number, lessonId: string) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, lessonIds: s.lessonIds.filter((lid) => lid !== lessonId) }
          : s
      )
    );
  }

  function moveLessonInSection(
    index: number,
    lessonIdx: number,
    direction: -1 | 1
  ) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const target = lessonIdx + direction;
        if (target < 0 || target >= s.lessonIds.length) return s;
        const next = [...s.lessonIds];
        [next[lessonIdx], next[target]] = [next[target], next[lessonIdx]];
        return { ...s, lessonIds: next };
      })
    );
  }

  async function handleSave() {
    setSaveError(null);

    if (!isEditing && !id.trim()) {
      setSaveError("A course id is required.");
      return;
    }
    if (!language.trim() || !level.trim() || !title.trim()) {
      setSaveError("Language, level, and title are all required.");
      return;
    }
    if (sections.some((s) => !s.title.trim())) {
      setSaveError("Every section needs a title.");
      return;
    }

    const sectionsPayload = sections.map((s) => ({
      ...(s.id ? { id: s.id } : {}),
      title: s.title.trim(),
      displayOrder: s.displayOrder,
      lessonIds: s.lessonIds,
    }));

    setSaving(true);
    try {
      if (isEditing) {
        const body: Omit<LessonEngineCoursePayload, "id"> = {
          language: language.trim(),
          level: level.trim(),
          title: title.trim(),
          description: description.trim() || undefined,
          published,
          displayOrder,
          sections: sectionsPayload,
        };
        await authedFetch(`/api/admin/lesson-engine/courses/${course.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        const body: LessonEngineCoursePayload = {
          id: id.trim(),
          language: language.trim(),
          level: level.trim(),
          title: title.trim(),
          description: description.trim() || undefined,
          published,
          displayOrder,
          sections: sectionsPayload,
        };
        await authedFetch("/api/admin/lesson-engine/courses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      router.push("/admin/lesson-engine/courses");
    } catch (err) {
      setSaveError(
        err instanceof ApiRequestError ? err.message : "Failed to save course."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <EngineSubnav />
      </Reveal>

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground"
            >
              <Link href="/admin/lesson-engine/courses">
                <ArrowLeft className="size-4" />
                Back to courses
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              {isEditing ? "Edit course" : "New course"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing
                ? "Update this course's metadata and section structure."
                : "Group lessons into ordered sections for learners."}
            </p>
          </div>
          <Button variant="accent" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isEditing ? "Save changes" : "Create course"}
          </Button>
        </div>
        {saveError && <p className="mt-2 text-sm text-danger">{saveError}</p>}
      </Reveal>

      {/* Metadata */}
      <Reveal delay={0.03}>
        <Card className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="course-id">Course id</Label>
              <Input
                id="course-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="fr_a1"
                disabled={isEditing}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isEditing
                  ? "The id is permanent and can't be changed after creation."
                  : "Letters, numbers, underscore, hyphen. Permanent once created."}
              </p>
            </div>
            <div>
              <Label htmlFor="course-language">Language</Label>
              <Input
                id="course-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="fr"
              />
            </div>
            <div>
              <Label htmlFor="course-level">Level</Label>
              <Input
                id="course-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="A1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="course-title">Title</Label>
              <Input
                id="course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="French · A1 Foundations"
              />
            </div>
            <div>
              <Label htmlFor="course-order">Display order</Label>
              <Input
                id="course-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="course-description">Description (optional)</Label>
            <AdminTextarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Your first steps into French."
              className="min-h-[64px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy">
                {published ? "Published" : "Draft"}
              </p>
              <p className="text-xs text-muted-foreground">
                Published courses are visible to learners via the public API.
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

      {/* Sections */}
      <Reveal delay={0.05}>
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-navy">Sections</h2>
              <p className="text-xs text-muted-foreground">
                Each section groups an ordered list of lessons. Lessons play in
                the order shown here.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="size-3.5" />
              Add section
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No sections yet. Add one to start assigning lessons.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id ?? `new-${index}`}
                  index={index}
                  section={section}
                  allLessons={availableLessons}
                  lessonsLoading={lessonsLoading}
                  lessonMetaById={lessonMetaById}
                  onChangeTitle={(v) => updateSection(index, { title: v })}
                  onChangeOrder={(v) => updateSection(index, { displayOrder: v })}
                  onRemove={() => removeSection(index)}
                  onAddLesson={(lid) => addLessonToSection(index, lid)}
                  onRemoveLesson={(lid) => removeLessonFromSection(index, lid)}
                  onMoveLesson={(lessonIdx, dir) =>
                    moveLessonInSection(index, lessonIdx, dir)
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

function SectionCard({
  index,
  section,
  allLessons,
  lessonsLoading,
  lessonMetaById,
  onChangeTitle,
  onChangeOrder,
  onRemove,
  onAddLesson,
  onRemoveLesson,
  onMoveLesson,
}: {
  index: number;
  section: SectionState;
  allLessons: AdminLessonEngineLessonSummary[];
  lessonsLoading: boolean;
  lessonMetaById: Map<string, { title: string; language: string; level: string }>;
  onChangeTitle: (value: string) => void;
  onChangeOrder: (value: number) => void;
  onRemove: () => void;
  onAddLesson: (lessonId: string) => void;
  onRemoveLesson: (lessonId: string) => void;
  onMoveLesson: (lessonIdx: number, direction: -1 | 1) => void;
}) {
  const [search, setSearch] = useState("");

  const assigned = new Set(section.lessonIds);
  const query = search.trim().toLowerCase();
  const results =
    query.length === 0
      ? []
      : allLessons
          .filter((l) => !assigned.has(l.id))
          .filter(
            (l) =>
              l.title.toLowerCase().includes(query) ||
              l.id.toLowerCase().includes(query)
          )
          .slice(0, 8);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`section-title-${index}`}>Section title</Label>
          <Input
            id={`section-title-${index}`}
            value={section.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Unit 1 — First Contact"
          />
        </div>
        <div className="w-full sm:w-32">
          <Label htmlFor={`section-order-${index}`}>Display order</Label>
          <Input
            id={`section-order-${index}`}
            type="number"
            value={section.displayOrder}
            onChange={(e) => onChangeOrder(Number(e.target.value) || 0)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-danger hover:bg-danger/10"
        >
          <Trash2 className="size-3.5" />
          Remove
        </Button>
      </div>

      {/* Assigned lessons, ordered */}
      <div className="flex flex-col gap-2">
        {section.lessonIds.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No lessons assigned yet.
          </p>
        ) : (
          section.lessonIds.map((lessonId, lessonIdx) => {
            const meta = lessonMetaById.get(lessonId);
            return (
              <div
                key={lessonId}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {lessonIdx + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">
                    {meta?.title ?? lessonId}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    <span className="font-mono">{lessonId}</span>
                    {meta ? ` · ${meta.language} · ${meta.level}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move up"
                    disabled={lessonIdx === 0}
                    onClick={() => onMoveLesson(lessonIdx, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move down"
                    disabled={lessonIdx === section.lessonIds.length - 1}
                    onClick={() => onMoveLesson(lessonIdx, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove lesson"
                    onClick={() => onRemoveLesson(lessonId)}
                    className="text-danger hover:bg-danger/10"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add-lesson search */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Add lesson to this section — search by title or id"
            className="pl-9"
          />
        </div>
        {query.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-1">
            {lessonsLoading ? (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading lessons…
              </div>
            ) : results.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No matching lessons available.
              </p>
            ) : (
              results.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => {
                    onAddLesson(lesson.id);
                    setSearch("");
                  }}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-navy">
                      {lesson.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      <span className="font-mono">{lesson.id}</span> ·{" "}
                      {lesson.language} · {lesson.level}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {!lesson.published && (
                      <Badge variant="outline">Draft</Badge>
                    )}
                    <Plus className="size-4 text-accent" />
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
