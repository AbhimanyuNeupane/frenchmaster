"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types/admin";

/** Prev/next pager for the offset-paginated admin lists. */
export function PaginationControls({
  pagination,
  onPageChange,
  disabled = false,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { page, pageSize, total, totalPages } = pagination;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-semibold text-navy">{from}</span>–
            <span className="font-semibold text-navy">{to}</span> of{" "}
            <span className="font-semibold text-navy">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="px-1 text-xs font-medium text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
