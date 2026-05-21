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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {error?.message ?? "Book not found."}
          </p>
          <Link href="/library">
            <Button className="mt-4" variant="outline">
              Back to library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/library"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Library
          </Link>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteBook.isPending}
                >
                  {deleteBook.isPending ? "Deleting…" : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        {!isEditing ? (
          /* View mode */
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic; next/image requires known dimensions or remotePatterns for every CDN
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-40 w-28 rounded object-cover shadow"
                  />
                ) : (
                  <div className="flex h-40 w-28 items-center justify-center rounded bg-gray-100 text-4xl shadow">
                    📖
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="text-2xl font-semibold leading-tight">
                    {book.title}
                  </h2>
                  <p className="text-gray-600">{book.author}</p>
                  <Badge variant={STATUS_BADGE_VARIANT[book.status]}>
                    {STATUS_LABELS[book.status]}
                  </Badge>
                  {book.rating != null && (
                    <p className="text-yellow-500">
                      {"★".repeat(book.rating)}
                      {"☆".repeat(5 - book.rating)}
                    </p>
                  )}
                  {book.isbn && (
                    <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
                  )}
                  {book.dateFinished && (
                    <p className="text-sm text-gray-500">
                      Finished:{" "}
                      {new Date(book.dateFinished).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-400">
                    Added: {new Date(book.dateAdded).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {book.notes && (
                <div className="mt-6 rounded-md bg-gray-50 p-4">
                  <p className="mb-1 text-sm font-medium text-gray-700">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {book.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Edit mode */
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
