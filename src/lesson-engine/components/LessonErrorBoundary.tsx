"use client";

import * as React from "react";
import { Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonLoadError } from "../services/content/types";

interface Props {
  children: React.ReactNode;
  onExit?: () => void;
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors from the renderer subtree and shows a recovery
 * screen instead of an unhandled crash. Distinguishes two failure modes:
 *
 * - A gated lesson (`LessonLoadError` with `requiredRole` — a 403 from the
 *   backend): being locked isn't a broken-data failure, so we show a friendly
 *   "requires an X account" message with only a way back, no retry framing. We
 *   deliberately do NOT show an "Upgrade" button — there's no payments/upgrade
 *   flow in this app, so we state the requirement honestly rather than promise
 *   functionality that doesn't exist.
 * - Anything else (missing/corrupt lesson JSON, network error): the generic
 *   retry/exit screen.
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
    const { error } = this.state;
    if (!error) return this.props.children;

    const gatedRole =
      error instanceof LessonLoadError ? error.requiredRole : undefined;

    if (gatedRole) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Lock className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            This lesson is locked
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            It requires a {gatedRole} account. Your current access level
            doesn&apos;t include it yet.
          </p>
          {this.props.onExit && (
            <Button variant="accent" onClick={this.props.onExit}>
              Back to lessons
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-10 text-center">
        <TriangleAlert className="h-8 w-8 text-danger" />
        <h2 className="text-lg font-semibold text-foreground">
          We couldn&apos;t load this lesson
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message}
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
}
