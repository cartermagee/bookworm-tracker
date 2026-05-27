import Link from "next/link";
import type { components } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";

type BookDto = components["schemas"]["BookDto"];

interface BookListProps {
  books: BookDto[];
  isLoading: boolean;
  error: Error | null;
}

export function BookList({ books, isLoading, error }: BookListProps) {
  if (isLoading) {
    return (
      <div
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
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-error-surface px-4 py-3 text-sm text-error-text">
        Failed to load books: {error.message}
      </p>
    );
  }

  if (books.length === 0) {
    return (
      <div className="py-20 text-center">
        <p
          aria-hidden="true"
          className="mb-3 text-5xl"
        >
          📚
        </p>
        <p className="text-lg font-medium text-foreground">Your library is empty</p>
        <p className="mt-1 text-sm text-secondary">
          Add your first book to get started.
        </p>
        <Link href="/library/new" className="inline-block mt-5">
          <Button>Add your first book</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
