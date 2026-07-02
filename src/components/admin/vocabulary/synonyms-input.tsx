"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Tag-style input for the free-text `synonyms` string[]. Add a synonym with
 * Enter or comma; remove with the chip's X or Backspace on an empty field.
 * Nicer for content authoring than a raw comma-separated text box.
 */
export function SynonymsInput({
  value,
  onChange,
  disabled = false,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value.length - 1);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-sm shadow-sm transition-colors focus-within:ring-2 focus-within:ring-accent",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {value.map((synonym, index) => (
        <span
          key={`${synonym}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-navy/10 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-navy"
        >
          {synonym}
          <button
            type="button"
            aria-label={`Remove ${synonym}`}
            onClick={() => remove(index)}
            disabled={disabled}
            className="flex size-4 items-center justify-center rounded-full text-navy/60 hover:bg-navy/10 hover:text-navy"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        disabled={disabled}
        placeholder={value.length === 0 ? "Type a synonym and press Enter" : ""}
        className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
