import { m } from "framer-motion";
import type { components } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPillRow } from "@/components/StatusPillRow";
import { heroScale, detailText, contentFadeUp } from "@/lib/motion/variants";

type BookDto    = components["schemas"]["BookDto"];
type BookStatus = components["schemas"]["BookStatus"];

interface BookDetailViewProps {
  book: BookDto;
  /** When > 0 the view-mode panels skip their entrance animation (post-save). */
  saveCount: number;
  onStatusChange: (status: BookStatus) => void;
  isStatusPending?: boolean;
}

/**
 * Read-only view of a single book — cover hero, metadata, notes.
 * Separated from BookDetailPage to reduce its cyclomatic complexity.
 */
export function BookDetailView({
  book,
  saveCount,
  onStatusChange,
  isStatusPending = false,
}: BookDetailViewProps) {
  const stars = book.rating ?? 0;
  const animated = saveCount === 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/*
           * Hero cover: springs in from scale 0.72 → 1.
           * The "book opening" moment of the page.
           */}
          <m.div
            variants={heroScale}
            initial={animated ? "hidden" : false}
            animate="visible"
            className="shrink-0"
          >
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic
              <img
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-40 w-28 rounded-lg object-cover shadow-md"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-40 w-28 items-center justify-center rounded-lg bg-surface-alt text-4xl shadow-sm"
              >
                📖
              </div>
            )}
          </m.div>

          {/* Text block rises 100 ms after the cover reveals */}
          <m.div
            variants={detailText}
            initial={animated ? "hidden" : false}
            animate="visible"
            className="flex flex-1 flex-col gap-2 min-w-0"
          >
            <h1 className="text-2xl font-semibold leading-tight text-foreground">
              {book.title}
            </h1>
            <p className="text-secondary">{book.author}</p>

            <StatusPillRow
              currentStatus={book.status}
              onStatusChange={onStatusChange}
              isPending={isStatusPending}
            />

            {stars > 0 && (
              <p
                className="text-star text-lg"
                aria-label={`Rated ${stars} out of 5 stars`}
              >
                {"★".repeat(stars)}
                {"☆".repeat(5 - stars)}
              </p>
            )}

            {book.isbn && (
              <p className="text-sm text-secondary">ISBN: {book.isbn}</p>
            )}
            {book.dateFinished && (
              <p className="text-sm text-secondary">
                Finished: {new Date(book.dateFinished).toLocaleDateString()}
              </p>
            )}
            <p className="text-sm text-secondary">
              Added: {new Date(book.dateAdded).toLocaleDateString()}
            </p>
          </m.div>
        </div>

        {/* Notes section fades up after the details */}
        {book.notes && (
          <m.div
            variants={contentFadeUp}
            initial={animated ? "hidden" : false}
            animate="visible"
            className="mt-6 rounded-lg bg-surface-alt p-4"
          >
            <p className="mb-1.5 text-sm font-semibold text-foreground">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-secondary leading-relaxed">
              {book.notes}
            </p>
          </m.div>
        )}
      </CardContent>
    </Card>
  );
}
