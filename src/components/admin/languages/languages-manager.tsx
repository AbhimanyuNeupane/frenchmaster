"use client";

import { useState } from "react";
import { Loader2, Globe, Plus, Pencil } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageError } from "@/components/layout/page-state";
import { LanguageFormDialog } from "@/components/admin/languages/language-form-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AdminLanguage } from "@/types/language";

export function LanguagesManager() {
  const { authedFetch } = useAuth();

  const { data, isLoading, error, refetch } = useApiQuery<AdminLanguage[]>("/api/admin/languages");
  const languages = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  function openCreate() {
    setActiveLanguage(null);
    setFormOpen(true);
  }

  function openEdit(language: AdminLanguage) {
    setActiveLanguage(language);
    setFormOpen(true);
  }

  async function toggleEnabled(language: AdminLanguage) {
    // The default language can never be disabled — the toggle is already
    // disabled in the UI, so this is just a defensive guard.
    if (language.isDefault && language.enabled) return;
    setTogglingCode(language.code);
    setToggleError(null);
    try {
      await authedFetch(`/api/admin/languages/${language.code}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !language.enabled }),
      });
      refetch();
    } catch (err) {
      setToggleError(
        err instanceof ApiRequestError ? err.message : "Failed to update language."
      );
    } finally {
      setTogglingCode(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Languages</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the languages vocabulary can be translated into and offered to learners.
            </p>
          </div>
          <Button variant="accent" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add language
          </Button>
        </div>
        {toggleError && <p className="mt-2 text-sm text-danger">{toggleError}</p>}
      </Reveal>

      {error ? (
        <PageError message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : languages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Globe className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No languages yet</p>
          <Button variant="accent" size="sm" onClick={openCreate} className="mt-2">
            <Plus className="size-4" />
            Add language
          </Button>
        </div>
      ) : (
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {languages.map((language) => {
              const toggling = togglingCode === language.code;
              const lockDisable = language.isDefault; // default can't be disabled
              return (
                <Card
                  key={language.code}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="text-2xl leading-none">
                      {language.flagEmoji}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-navy">{language.name}</p>
                        <Badge variant="outline" className="uppercase">
                          {language.code}
                        </Badge>
                        {language.isDefault && <Badge variant="accent">Default</Badge>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Display order {language.displayOrder}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          language.enabled ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        {language.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {lockDisable ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <EnabledSwitch enabled={language.enabled} disabled onClick={() => {}} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            The default language can&apos;t be disabled.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <EnabledSwitch
                          enabled={language.enabled}
                          disabled={toggling}
                          onClick={() => toggleEnabled(language)}
                        />
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(language)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Reveal>
      )}

      <LanguageFormDialog
        language={activeLanguage}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => refetch()}
      />
    </div>
  );
}

function EnabledSwitch({
  enabled,
  disabled,
  onClick,
}: {
  enabled: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Disable language" : "Enable language"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        enabled ? "bg-success" : "bg-border"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
