"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  onExit?: () => void;
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors from the renderer subtree — most importantly the
 * typed LessonLoadError thrown when lesson JSON is missing/corrupt — and shows a
 * retry/exit screen instead of an unhandled crash.
 */
export class LessonErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[lesson-engine] render error:", error);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-10 text-center">
          <TriangleAlert className="h-8 w-8 text-danger" />
          <h2 className="text-lg font-semibold text-foreground">
            We couldn&apos;t load this lesson
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <div className="flex gap-2">
            <Button variant="accent" onClick={this.reset}>
              Try again
            </Button>
            {this.props.onExit && (
              <Button variant="outline" onClick={this.props.onExit}>
                Exit
              </Button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
