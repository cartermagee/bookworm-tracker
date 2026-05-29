import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { components } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";

type BookDto    = components["schemas"]["BookDto"];
type BookStatus = components["schemas"]["BookStatus"];

interface BookListProps {
  books: BookDto[];
  isLoading: boolean;
  error: Error | null;
  onCardStatusChange: (book: BookDto, status: BookStatus) => void;
  pendingBookId?: string;
  isCardStatusPending?: boolean;
}

export function BookList({
  books,
  isLoading,
  error,
  onCardStatusChange,
  pendingBookId,
  isCardStatusPending = false,
}: BookListProps) {
  /* ── Loading: pulsing skeletons ─────────────────────────────── */
  if (isLoading) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="status"
        aria-label="Loading your library"
        className="grid gap-3 sm:grid-cols-2"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border bg-surface animate-pulse"
          />
        ))}
      </m.div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────── */
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-error-surface px-4 py-3 text-sm text-error-text"
      >
        Failed to load books: {error.message}
      </p>
    );
  }

  /* ── Empty state ────────────────────────────────────────────── */
  if (books.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="py-20 text-center"
      >
        {/* Book emoji does a little waggle to catch the eye */}
        <m.p
          aria-hidden="true"
          className="mb-3 text-5xl select-none"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ delay: 0.35, duration: 0.7, ease: "easeInOut" }}
        >
          📚
        </m.p>
        <p className="text-lg font-medium text-foreground">
          Your library is empty
        </p>
        <p className="mt-1 text-sm text-secondary">
          Add your first book to get started.
        </p>
        <Link href="/library/new" className="inline-block mt-5">
          <Button>Add your first book</Button>
        </Link>
      </m.div>
    );
  }

  /* ── Book grid ──────────────────────────────────────────────── */
  return (
    /*
     * Each card has explicit initial/animate values (not variant propagation)
     * so re-renders from query/mutation state changes can't interrupt the
     * enter animation. Stagger is implemented via per-card delay.
     * AnimatePresence mode="popLayout": exiting cards shrink-fade out and
     * the grid reflows while entering cards rise in on filter changes.
     * layout on each item: cards that stay in place glide to new positions.
     */
    <div className="grid gap-3 sm:grid-cols-2">
      <AnimatePresence mode="popLayout">
        {books.map((book, index) => (
          <m.div
            key={book.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            layout
            whileTap={{ scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 28,
              delay: index * 0.05,
            }}
          >
            <BookCard
              book={book}
              onStatusChange={(status) => onCardStatusChange(book, status)}
              isStatusPending={isCardStatusPending && pendingBookId === book.id}
            />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
