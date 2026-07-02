"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminSelect } from "@/components/admin/form-controls";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError, parseApiResponse } from "@/lib/api-client";
import { downloadAuthedFile } from "@/lib/download";
import type { CEFRLevel } from "@/types";
import type { ImportCommitResponse, ImportPreviewResponse } from "@/types/admin";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

type Step = "select" | "preview" | "result";

export function VocabularyImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const { authedFetchRaw, authedFetch } = useAuth();

  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CEFRLevel>("A1");
  const [unitTitle, setUnitTitle] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportCommitResponse | null>(null);

  function reset() {
    setStep("select");
    setFile(null);
    setLevel("A1");
    setUnitTitle("");
    setBusy(false);
    setError(null);
    setPreview(null);
    setResult(null);
  }

  function handleClose(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) {
      // Reset after the close animation so content doesn't flash mid-dismiss.
      setTimeout(reset, 200);
    }
  }

  async function handleDownloadExample() {
    setError(null);
    try {
      await downloadAuthedFile(
        authedFetchRaw,
        "/api/admin/vocabulary/import/example",
        "vocabulary-import-example.csv"
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to download example.");
    }
  }

  async function handlePreview() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authedFetchRaw("/api/admin/vocabulary/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = await parseApiResponse<ImportPreviewResponse>(res);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to preview file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    const validRows = preview.rows.filter((r) => r.errors.length === 0).map((r) => r.data);
    if (validRows.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const data = await authedFetch<ImportCommitResponse>(
        "/api/admin/vocabulary/import/commit",
        {
          method: "POST",
          body: JSON.stringify({ rows: validRows, level, unitTitle: unitTitle.trim() }),
        }
      );
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to import.");
    } finally {
      setBusy(false);
    }
  }

  const canPreview = Boolean(file) && unitTitle.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import vocabulary from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV of words. French and English are required columns; any column matching a
            language name becomes that language&apos;s translation.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — select file + batch level/unit */}
        {step === "select" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-secondary/30 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileUp className="size-4" />
                  {file ? file.name : "No file selected"}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadExample}
                  className="text-accent hover:bg-accent/10"
                >
                  <Download className="size-3.5" />
                  Download example CSV
                </Button>
              </div>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium"
              />
            </div>

            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="mb-3 text-sm font-medium text-navy">
                All words in this file will be added to:
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="import-level">Level</Label>
                  <AdminSelect
                    id="import-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <div>
                  <Label htmlFor="import-unit">Unit / category</Label>
                  <Input
                    id="import-unit"
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    placeholder="Greetings"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handlePreview}
                disabled={!canPreview || busy}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Preview
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — preview */}
        {step === "preview" && preview && (
          <div className="flex flex-col gap-4">
            {preview.fatalError ? (
              <div className="flex items-start gap-2 rounded-xl bg-danger/10 p-3.5 text-sm text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{preview.fatalError}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1 font-medium text-navy">
                    {preview.totalRows} rows
                  </span>
                  <span className="rounded-full bg-success/15 px-3 py-1 font-medium text-success">
                    {preview.validRowCount} valid
                  </span>
                  <span className="rounded-full bg-danger/15 px-3 py-1 font-medium text-danger">
                    {preview.errorRowCount} with errors
                  </span>
                </div>

                {preview.unrecognizedColumns.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-navy">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    <span>
                      Ignored unrecognized column(s):{" "}
                      <span className="font-semibold">
                        {preview.unrecognizedColumns.join(", ")}
                      </span>
                      . Only French, English, Pronunciation, and known language names are imported.
                    </span>
                  </div>
                )}

                <div className="max-h-[40vh] overflow-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-secondary">
                      <tr className="text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">#</th>
                        <th className="px-3 py-2 font-semibold">French</th>
                        <th className="px-3 py-2 font-semibold">English</th>
                        <th className="px-3 py-2 font-semibold">Pron.</th>
                        <th className="px-3 py-2 font-semibold">Other</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row) => {
                        const hasError = row.errors.length > 0;
                        return (
                          <tr
                            key={row.rowNumber}
                            className={hasError ? "bg-danger/5" : "border-t border-border"}
                          >
                            <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-navy">{row.data.french}</td>
                            <td className="px-3 py-2">{row.data.english}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {row.data.pronunciation}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {row.data.translations.length > 0
                                ? `${row.data.translations.length} lang`
                                : "—"}
                            </td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <span className="text-danger">{row.errors.join("; ")}</span>
                              ) : (
                                <span className="text-success">OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("select")}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleCommit}
                disabled={busy || !!preview.fatalError || preview.validRowCount === 0}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                <Upload className="size-4" />
                Import {preview.validRowCount} valid {preview.validRowCount === 1 ? "row" : "rows"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — result */}
        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-success/10 p-4">
              <CheckCircle2 className="size-5 shrink-0 text-success" />
              <p className="text-sm font-medium text-navy">
                Imported {result.imported} {result.imported === 1 ? "word" : "words"}
                {result.skipped > 0 ? `, skipped ${result.skipped}.` : "."}
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-[30vh] overflow-auto rounded-xl border border-border p-3 text-xs">
                <p className="mb-2 font-semibold text-navy">Skipped rows</p>
                <ul className="flex flex-col gap-1">
                  {result.errors.map((e) => (
                    <li key={e.rowNumber} className="text-muted-foreground">
                      <span className="font-medium text-navy">Row {e.rowNumber}:</span>{" "}
                      <span className="text-danger">{e.errors.join("; ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  onImported();
                  handleClose(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
