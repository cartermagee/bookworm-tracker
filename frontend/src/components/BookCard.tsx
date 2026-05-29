import Link from "next/link";
import type { components } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPopover } from "@/components/StatusPopover";

type BookDto    = components["schemas"]["BookDto"];
type BookStatus = components["schemas"]["BookStatus"];

export const STATUS_LABELS: Record<BookStatus, string> = {
  wantToRead: "Want to Read",
  reading:    "Reading",
  read:       "Read",
};

export const STATUS_BADGE_VARIANT: Record<
  BookStatus,
  "want" | "default" | "secondary"
> = {
  wantToRead: "want",
  reading:    "default",
  read:       "secondary",
};

interface BookCardProps {
  book: BookDto;
}

export function BookCard({ book }: BookCardProps) {
  const stars = book.rating ?? 0;

  return (
    <Link
      href={`/library/${book.id}`}
      aria-label={`${book.title} by ${book.author} — ${STATUS_LABELS[book.status]}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 group-focus-visible:shadow-md">
        <CardContent className="flex gap-4 p-4">
          {/* Cover thumbnail */}
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic
            <img
              src={book.coverUrl}
              alt=""
              aria-hidden="true"
              className="h-20 w-14 shrink-0 rounded object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-surface-alt text-2xl"
            >
              📖
            </div>
          )}

          {/* Book info */}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-semibold leading-snug text-foreground line-clamp-2">
              {book.title}
            </p>
            <p className="mt-0.5 text-sm text-secondary truncate">{book.author}</p>

            <div className="mt-auto flex items-center gap-2 pt-2">
              <StatusPopover book={book} />
              {stars > 0 && (
                <span
                  className="text-xs text-star"
                  aria-label={`Rated ${stars} out of 5 stars`}
                >
                  {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
