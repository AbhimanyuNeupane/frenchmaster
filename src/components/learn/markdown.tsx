import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders the small markdown subset the lesson content actually uses:
 * `**bold**` inline emphasis, `- ` bullet lists, and blank-line-separated
 * paragraphs. Deliberately minimal — no external markdown dependency — and
 * safe by construction: only plain text and a fixed set of elements are
 * emitted, never raw HTML.
 */

/** Splits a line into text + <strong> runs on `**bold**` markers. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-navy">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "))}</p>
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
            />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushBullets();
    } else if (line.startsWith("- ")) {
      flushParagraph();
      bullets.push(line.replace(/^-\s+/, ""));
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();

  return (
    <div className={cn("flex flex-col gap-3 text-sm leading-relaxed text-foreground/80", className)}>
      {blocks}
    </div>
  );
}
