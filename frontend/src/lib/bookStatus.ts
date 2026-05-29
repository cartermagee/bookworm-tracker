import type { components } from "@/lib/api/types";

type BookStatus = components["schemas"]["BookStatus"];

/** Human-readable label for each reading status. */
export const STATUS_LABELS: Record<BookStatus, string> = {
  wantToRead: "Want to Read",
  reading:    "Reading",
  read:       "Read",
};

/** Badge variant for each reading status. */
export const STATUS_BADGE_VARIANT: Record<
  BookStatus,
  "want" | "default" | "secondary"
> = {
  wantToRead: "want",
  reading:    "default",
  read:       "secondary",
};
