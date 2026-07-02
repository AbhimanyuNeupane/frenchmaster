import { Volume2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeTranslation } from "@/components/vocabulary/native-translation";
import type { LessonVocabularyWord } from "@/types/lesson";

const GENDER_LABEL: Record<NonNullable<LessonVocabularyWord["gender"]>, string> = {
  masculine: "m.",
  feminine: "f.",
  neutral: "n.",
};

function VocabItem({ word }: { word: LessonVocabularyWord }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {word.gender && (
            <Badge variant="outline" className="lowercase">
              {GENDER_LABEL[word.gender]}
            </Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {word.partOfSpeech}
          </Badge>
        </div>
        <button
          type="button"
          aria-label="Play pronunciation"
          disabled={!word.audioUrl}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
        >
          <Volume2 className="size-4" />
        </button>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h4 className="text-lg font-bold text-navy">{word.french}</h4>
          <span className="text-xs text-muted-foreground">{word.pronunciationIpa}</span>
        </div>
        <p className="text-sm text-foreground/80">{word.english}</p>
        <NativeTranslation translation={word.nativeTranslation} className="mt-0.5" />
      </div>

      <div className="rounded-lg bg-secondary/60 p-2.5">
        <p className="text-sm font-medium text-navy">{word.exampleFr}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{word.exampleEn}</p>
      </div>
    </Card>
  );
}

export function LessonVocabulary({ words }: { words: LessonVocabularyWord[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {words.map((word) => (
        <VocabItem key={word.id} word={word} />
      ))}
    </div>
  );
}
