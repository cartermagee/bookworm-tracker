"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useBook, useUpdateBook, useDeleteBook } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookForm, type BookFormValues } from "@/components/BookForm";
import { BookDetailView } from "@/components/BookDetailView";
import { headerSlideDown } from "@/lib/motion/variants";

type BookStatus = components["schemas"]["BookStatus"];

type PageProps = { params: Promise<{ id: string }> };

export default function BookDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: book, isLoading, error } = useBook(id);
  const updateBook = useUpdateBook(id);
  const deleteBook = useDeleteBook();
  const [isEditing, setIsEditing] = useState(false);
  // Counts completed saves. When > 0 the view-mode panels use initial={false}
  // so they appear instantly at their animate target rather than fading in
  // from opacity:0 — which would stall in headless Chromium (RAF throttled).
  const [saveCount, setSaveCount] = useState(0);

  async function handleStatusChange(status: BookStatus) {
    if (!book) return;
    // Server requires dateFinished when status="read", null otherwise.
    const dateFinished =
      status === "read"
        ? (book.dateFinished ?? new Date().toISOString())
        : null;
    try {
      await updateBook.mutateAsync({
        title: book.title,
        author: book.author,
        isbn: book.isbn ?? null,
        coverUrl: book.coverUrl ?? null,
        openLibraryWorkId: book.openLibraryWorkId ?? null,
        status,
        rating: book.rating ?? null,
        notes: book.notes ?? null,
        dateFinished,
      });
      setSaveCount((n) => n + 1);
    } catch {
      // error displayed via updateBook.error
    }
  }

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
      setSaveCount((n) => n + 1);
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

  /* ── Loading ──────────────────────────────────────────────────── */
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

  /* ── Error / not found ────────────────────────────────────────── */
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

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── slides down ─────────────────────────────────── */}
      <m.header
        variants={headerSlideDown}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-6 py-4"
      >
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
      </m.header>

      <main id="main-content" className="mx-auto max-w-2xl p-6">
        {!isEditing ? (
          /* ── View mode — delegated to BookDetailView ──────────── */
          <BookDetailView
            book={book}
            saveCount={saveCount}
            onStatusChange={handleStatusChange}
            isStatusPending={updateBook.isPending}
          />
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
