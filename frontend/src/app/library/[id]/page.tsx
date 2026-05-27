"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useBook, useUpdateBook, useDeleteBook } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";

type BookStatus = components["schemas"]["BookStatus"];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookForm, type BookFormValues } from "@/components/BookForm";
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from "@/components/BookCard";

type PageProps = { params: Promise<{ id: string }> };

export default function BookDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: book, isLoading, error } = useBook(id);
  const updateBook = useUpdateBook(id);
  const deleteBook = useDeleteBook();
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(data: BookFormValues) {
    try {
      await updateBook.mutateAsync({
        title: data.title,
        author: data.author,
        isbn: data.isbn ?? null,
        coverUrl: data.coverUrl ?? null,
        openLibraryWorkId: data.openLibraryWorkId ?? null,
        status: data.status,
        rating: data.rating ?? null,
        notes: data.notes ?? null,
        dateFinished: data.dateFinished ?? null,
      });
      setIsEditing(false);
    } catch {
      // error displayed via updateBook.error
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this book from your library?")) return;
    await deleteBook.mutateAsync(id);
    router.push("/library");
  }

  /* Loading */
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading book"
        className="flex min-h-screen items-center justify-center"
      >
        <div className="h-48 w-full max-w-2xl rounded-xl border border-border bg-surface animate-pulse mx-6" />
      </div>
    );
  }

  /* Error / not found */
  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p role="alert" className="text-error-text">
            {error?.message ?? "Book not found."}
          </p>
          <Link href="/library">
            <Button className="mt-4" variant="outline">
              ← Back to library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stars = book.rating ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/library"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            ← Library
          </Link>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteBook.isPending}
                  aria-label={`Delete "${book.title}" from library`}
                >
                  {deleteBook.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl p-6">
        {!isEditing ? (
          /* ── View mode ─────────────────────────────────────────── */
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Cover */}
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic
                  <img
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    className="h-40 w-28 shrink-0 rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-40 w-28 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-4xl shadow-sm"
                  >
                    📖
                  </div>
                )}

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2 min-w-0">
                  <h1 className="text-2xl font-semibold leading-tight text-foreground">
                    {book.title}
                  </h1>
                  <p className="text-secondary">{book.author}</p>

                  <Badge variant={STATUS_BADGE_VARIANT[book.status]} className="self-start">
                    {STATUS_LABELS[book.status]}
                  </Badge>

                  {stars > 0 && (
                    <p
                      className="text-star text-lg"
                      aria-label={`Rated ${stars} out of 5 stars`}
                    >
                      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
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
                </div>
              </div>

              {/* Notes */}
              {book.notes && (
                <div className="mt-6 rounded-lg bg-surface-alt p-4">
                  <p className="mb-1.5 text-sm font-semibold text-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm text-secondary leading-relaxed">
                    {book.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ── Edit mode ─────────────────────────────────────────── */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Book</CardTitle>
            </CardHeader>
            <CardContent>
              <BookForm
                defaultValues={{
                  title: book.title,
                  author: book.author,
                  isbn: book.isbn ?? undefined,
                  coverUrl: book.coverUrl ?? undefined,
                  openLibraryWorkId: book.openLibraryWorkId ?? undefined,
                  status: book.status as BookStatus,
                  rating: book.rating ?? undefined,
                  notes: book.notes ?? undefined,
                  dateFinished: book.dateFinished ?? undefined,
                }}
                onSubmit={onSubmit}
                isPending={updateBook.isPending}
                error={updateBook.error}
                submitLabel="Save Changes"
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
