/**
 * Card barrel. Importing this module runs every card file for its registration
 * side effect (each card calls `registerCardComponent` at module scope). This is
 * the ONE file you edit to add a new card type — append its import line here.
 *
 * The renderer/navigation/validation engines never import from this barrel by
 * name; they only ever ask the registry for a component by `type` string.
 */
import "./TextCard";
import "./ImageCard";
import "./AudioCard";
import "./VocabularyCard";
import "./GrammarCard";
import "./InfoCard";
import "./FlashCard";
import "./ListeningCard";
import "./SpeakingCard";
import "./WritingCard";
import "./ConversationCard";
import "./FillBlankCard";
import "./DragOrderCard";
import "./MatchingCard";
import "./MultipleChoiceCard";
import "./MultipleSelectCard";
import "./TrueFalseCard";
import "./ImageChoiceCard";
import "./SummaryCard";
import "./QuizCard";
import "./RewardCard";
