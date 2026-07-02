import { LessonSectionCard } from "@/components/learn/lesson-section";
import { Markdown } from "@/components/learn/markdown";
import type { GrammarPoint } from "@/types/lesson";

function GrammarPointBlock({ point }: { point: GrammarPoint }) {
  return (
    <LessonSectionCard>
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-navy">{point.title}</h3>

        <Markdown content={point.explanation} />

        {point.examples.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-secondary/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Examples
            </p>
            <ul className="flex flex-col gap-2.5">
              {point.examples.map((ex, i) => (
                <li key={i} className="flex flex-col">
                  <span className="text-sm font-medium text-navy">{ex.frenchText}</span>
                  <span className="text-xs text-muted-foreground">{ex.englishText}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </LessonSectionCard>
  );
}

export function LessonGrammar({ points }: { points: GrammarPoint[] }) {
  return (
    <div className="flex flex-col gap-4">
      {points.map((point) => (
        <GrammarPointBlock key={point.id} point={point} />
      ))}
    </div>
  );
}
