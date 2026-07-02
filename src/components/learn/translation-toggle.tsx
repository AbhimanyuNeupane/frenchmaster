import { Languages } from "lucide-react";

/** Small inline toggle for revealing/hiding English translations. */
export function TranslationToggle({
  showTranslation,
  onToggle,
}: {
  showTranslation: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
    >
      <Languages className="size-3.5" />
      {showTranslation ? "Hide translation" : "Show translation"}
    </button>
  );
}
