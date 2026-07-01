import { VocabularyExplorer } from "@/components/vocabulary/vocabulary-explorer";
import { mockVocabularyData } from "@/lib/mock-vocabulary";

export default function VocabularyPage() {
  return <VocabularyExplorer initialData={mockVocabularyData} />;
}
