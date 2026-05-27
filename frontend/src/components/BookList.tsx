import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { components } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { staggerContainer, bookCard } from "@/lib/motion/variants";

type BookDto = components["schemas"]["BookDto"];

interface BookListProps {
  books: BookDto[];
  isLoading: boolean;
  error: Error | null;
}

export function BookList({ books, isLoading, error }: BookListProps) {
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
     * staggerContainer: on initial mount, children cascade in 50 ms apart.
     * AnimatePresence mode="popLayout": when the filter changes, exiting
     * cards shrink-fade out and the grid reflows while entering cards rise in.
     * layout on each item: cards that stay in place glide to new positions.
     */
    <m.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:grid-cols-2"
    >
      <AnimatePresence mode="popLayout">
        {books.map((book) => (
          <m.div
            key={book.id}
            variants={bookCard}
            exit={bookCard.exit as object}
            layout
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <BookCard book={book} />
          </m.div>
        ))}
      </AnimatePresence>
    </m.div>
  );
}
