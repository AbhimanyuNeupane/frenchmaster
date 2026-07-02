import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MultipleChoiceCard from "../cards/MultipleChoiceCard";
import FillBlankCard from "../cards/FillBlankCard";
import TrueFalseCard from "../cards/TrueFalseCard";
import type {
  FillBlankCardModel,
  MultipleChoiceCardModel,
  TrueFalseCardModel,
} from "../types";

describe("MultipleChoiceCard", () => {
  const card: MultipleChoiceCardModel = {
    id: "mc",
    type: "MultipleChoiceCard",
    title: "Pick one",
    content: {
      prompt: "Which means thanks?",
      options: [
        { id: "a", text: "Bonjour" },
        { id: "b", text: "Merci" },
      ],
    },
    validation: { correctOptionId: "b" },
  };

  it("submits the selected option id", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MultipleChoiceCard card={card} onSubmit={onSubmit} />);

    // Check is disabled until an option is chosen.
    const check = screen.getByRole("button", { name: /check/i });
    expect(check).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Merci" }));
    await user.click(check);

    expect(onSubmit).toHaveBeenCalledWith("b");
  });
});

describe("FillBlankCard", () => {
  const card: FillBlankCardModel = {
    id: "fb",
    type: "FillBlankCard",
    content: { textWithBlanks: "Je ___ français" },
    validation: { acceptedAnswers: ["parle"] },
  };

  it("submits the typed answer", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FillBlankCard card={card} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/fill in the blank/i), "parle");
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(onSubmit).toHaveBeenCalledWith("parle");
  });
});

describe("TrueFalseCard", () => {
  const card: TrueFalseCardModel = {
    id: "tf",
    type: "TrueFalseCard",
    content: { statement: "Salut is formal." },
    validation: { answer: false },
  };

  it("submits the chosen boolean", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TrueFalseCard card={card} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "False" }));
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(onSubmit).toHaveBeenCalledWith(false);
  });
});
