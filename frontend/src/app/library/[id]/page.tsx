"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBook, useUpdateBook, useDeleteBook } from "@/lib/api/queries";
import { updateBookSchema, type UpdateBookInput } from "@/lib/validation/book";
import type { components } from "@/lib/api/types";

type BookStatus = components["schemas"]["BookStatus"];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const STATUS_LABELS: Record<BookStatus, string> = {
  wantToRead: "Want to Read",
  reading: "Reading",
  read: "Read",
};

const STATUS_BADGE_VARIANT: Record<
  BookStatus,
  "default" | "secondary" | "outline"
> = {
  wantToRead: "outline",
  reading: "default",
  read: "secondary",
};

type PageProps = { params: Promise<{ id: string }> };

export default function BookDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: book, isLoading, error } = useBook(id);
  const updateBook = useUpdateBook(id);
  const deleteBook = useDeleteBook();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBookInput>({
    resolver: zodResolver(updateBookSchema),
  });

  const status = watch("status");

  function startEditing() {
    if (!book) return;
    reset({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? undefined,
      coverUrl: book.coverUrl ?? undefined,
      openLibraryWorkId: book.openLibraryWorkId ?? undefined,
      status: book.status,
      rating: book.rating ?? undefined,
      notes: book.notes ?? undefined,
      dateFinished: book.dateFinished ?? undefined,
    });
    setIsEditing(true);
  }

  async function onSubmit(data: UpdateBookInput) {
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
                <Button size="sm" variant="outline" onClick={startEditing}>
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && (
                    <p className="text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="author">Author *</Label>
                  <Input id="author" {...register("author")} />
                  {errors.author && (
                    <p className="text-sm text-red-600">
                      {errors.author.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" {...register("isbn")} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="coverUrl">Cover URL</Label>
                  <Input id="coverUrl" type="url" {...register("coverUrl")} />
                  {errors.coverUrl && (
                    <p className="text-sm text-red-600">
                      {errors.coverUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status">Status *</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="status"
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        {...field}
                      >
                        <option value="wantToRead">Want to Read</option>
                        <option value="reading">Reading</option>
                        <option value="read">Read</option>
                      </select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rating">Rating (1–5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    {...register("rating", {
                      setValueAs: (v: unknown) =>
                        v === "" || v == null ? null : parseInt(String(v), 10),
                    })}
                  />
                  {errors.rating && (
                    <p className="text-sm text-red-600">
                      {errors.rating.message}
                    </p>
                  )}
                </div>

                {status === "read" && (
                  <div className="space-y-1">
                    <Label htmlFor="dateFinished">Date Finished *</Label>
                    <Input
                      id="dateFinished"
                      type="date"
                      {...register("dateFinished", {
                        setValueAs: (v: unknown) =>
                          v === "" || v == null ? null : new Date(String(v)).toISOString(),
                      })}
                    />
                    {errors.dateFinished && (
                      <p className="text-sm text-red-600">
                        {errors.dateFinished.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("notes")}
                  />
                </div>

                {updateBook.error && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {updateBook.error.message}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || updateBook.isPending}
                  >
                    {updateBook.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
