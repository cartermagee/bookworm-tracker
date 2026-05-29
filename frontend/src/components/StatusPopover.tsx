"use client";
import { useState, useRef, useEffect } from "react";
import type { components } from "@/lib/api/types";
import { useUpdateBook } from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from "@/components/BookCard";

type BookDto    = components["schemas"]["BookDto"];
type BookStatus = components["schemas"]["BookStatus"];

const ALL_STATUSES: BookStatus[] = ["wantToRead", "reading", "read"];

interface StatusPopoverProps {
  book: BookDto;
}

/**
 * Renders the status badge on library list cards.
 * Clicking it opens a small popover to change status in-place.
 * Stops click propagation so the parent <Link> doesn't navigate.
 */
export function StatusPopover({ book }: StatusPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookStatus | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const updateBook = useUpdateBook(book.id);

  // Show the optimistic status while the mutation is in-flight;
  // fall back to the server-confirmed value once it resolves.
  const displayStatus = updateBook.isPending && pendingStatus ? pendingStatus : book.status;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleBadgeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!updateBook.isPending) setOpen((v) => !v);
  }

  async function handleSelect(e: React.MouseEvent, status: BookStatus) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (status === book.status) return;
    setPendingStatus(status);
    // Server requires dateFinished when status="read", null otherwise.
    const dateFinished =
      status === "read"
        ? (book.dateFinished ?? new Date().toISOString())
        : null;
    await updateBook.mutateAsync({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? null,
      coverUrl: book.coverUrl ?? null,
      openLibraryWorkId: book.openLibraryWorkId ?? null,
      status,
      rating: book.rating ?? null,
      notes: book.notes ?? null,
      dateFinished,
    });
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={handleBadgeClick}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Status: ${STATUS_LABELS[displayStatus]}. Click to change.`}
        disabled={updateBook.isPending}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
      >
        <Badge
          variant={STATUS_BADGE_VARIANT[displayStatus]}
          className={
            updateBook.isPending
              ? "opacity-50 cursor-wait"
              : "cursor-pointer hover:opacity-80 transition-opacity"
          }
        >
          {STATUS_LABELS[displayStatus]}
          <span className="ml-1 text-[10px] opacity-50">▾</span>
        </Badge>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select reading status"
          className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[148px] rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              role="option"
              aria-selected={s === book.status}
              type="button"
              onClick={(e) => handleSelect(e, s)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:bg-surface-alt
                ${s === displayStatus ? "font-semibold text-foreground" : "text-secondary"}`}
            >
              <span className="w-3 shrink-0 text-xs text-primary">
                {s === displayStatus ? "✓" : ""}
              </span>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
