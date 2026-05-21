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
    return <p className="text-gray-500">Loading your library…</p>;
  }

  if (error) {
    return (
      <p className="text-red-600">Failed to load books: {error.message}</p>
    );
  }

  if (books.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <p className="text-lg">Your library is empty.</p>
        <Link href="/library/new">
          <Button className="mt-4">Add your first book</Button>
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
