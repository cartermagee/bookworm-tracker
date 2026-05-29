"use client";
import { useState, useEffect } from "react";
import type { components } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from "@/components/BookCard";

type BookStatus = components["schemas"]["BookStatus"];

const ALL_STATUSES: BookStatus[] = ["wantToRead", "reading", "read"];

interface StatusPillRowProps {
  currentStatus: BookStatus;
  onStatusChange: (status: BookStatus) => void;
  isPending?: boolean;
}

/**
 * Renders the status badge on the book detail page.
 * Clicking the badge expands it inline into three pill options.
 * Selecting one collapses back to a single badge.
 */
export function StatusPillRow({
  currentStatus,
  onStatusChange,
  isPending = false,
}: StatusPillRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookStatus | null>(null);

  // Show optimistic status while mutation is in-flight; revert once settled.
  const displayStatus = isPending && pendingStatus ? pendingStatus : currentStatus;

  // Clear pending once the parent confirms the new status.
  useEffect(() => {
    if (!isPending) setPendingStatus(null);
  }, [isPending]);

  function handleExpand() {
    if (!isPending) setExpanded(true);
  }

  function handleSelect(status: BookStatus) {
    setExpanded(false);
    if (status !== currentStatus) {
      setPendingStatus(status);
      onStatusChange(status);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        aria-label={`Status: ${STATUS_LABELS[displayStatus]}. Click to change.`}
        disabled={isPending}
        className="self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
      >
        <Badge
          variant={STATUS_BADGE_VARIANT[displayStatus]}
          className={
            isPending
              ? "opacity-50 cursor-wait"
              : "cursor-pointer hover:opacity-80 transition-opacity"
          }
        >
          {STATUS_LABELS[displayStatus]}
          <span className="ml-1 text-[10px] opacity-50">▾</span>
        </Badge>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => handleSelect(s)}
          aria-pressed={s === displayStatus}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        >
          <Badge
            variant={s === displayStatus ? STATUS_BADGE_VARIANT[s] : "outline"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {s === displayStatus && <span className="mr-1 text-[10px]">✓</span>}
            {STATUS_LABELS[s]}
          </Badge>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Cancel status change"
        className="text-xs text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
      >
        ✕
      </button>
    </div>
  );
}
