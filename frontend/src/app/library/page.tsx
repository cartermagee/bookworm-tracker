"use client";
import { useState } from "react";
import Link from "next/link";
import { useBooks, useLogout } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";

type BookStatus = components["schemas"]["BookStatus"];
import { Button } from "@/components/ui/button";
import { BookList } from "@/components/BookList";
import { STATUS_LABELS } from "@/components/BookCard";

export default function LibraryPage() {
  const { data: books, isLoading, error } = useBooks();
  const logout = useLogout();
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const [sort, setSort] = useState<"dateAdded" | "title">("dateAdded");

  async function handleLogout() {
    await logout.mutateAsync();
    window.location.href = "/login";
  }

  const filtered =
    books
      ?.filter((b) => filter === "all" || b.status === filter)
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
      ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── App header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-xl font-semibold text-foreground">
            <span aria-hidden="true">📚 </span>Bookworm
          </span>
          <div className="flex gap-2">
            <Link href="/library/new">
              <Button size="sm">+ Add Book</Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              aria-label="Sign out of Bookworm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main id="main-content" className="mx-auto max-w-4xl p-6">
        {/* Filter + Sort toolbar */}
        <div
          role="toolbar"
          aria-label="Filter and sort books"
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          {/* Status filters */}
          <div
            role="group"
            aria-label="Filter by reading status"
            className="flex flex-wrap gap-1.5"
          >
            {(["all", "wantToRead", "reading", "read"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </Button>
            ))}
          </div>

          {/* Sort controls */}
          <div
            role="group"
            aria-label="Sort books"
            className="ml-auto flex gap-1.5"
          >
            <Button
              size="sm"
              variant={sort === "dateAdded" ? "default" : "outline"}
              onClick={() => setSort("dateAdded")}
              aria-pressed={sort === "dateAdded"}
            >
              Newest
            </Button>
            <Button
              size="sm"
              variant={sort === "title" ? "default" : "outline"}
              onClick={() => setSort("title")}
              aria-pressed={sort === "title"}
            >
              A – Z
            </Button>
          </div>
        </div>

        {/* Book count */}
        {!isLoading && !error && books && (
          <p className="mb-3 text-sm text-secondary" aria-live="polite">
            {filtered.length === 0
              ? "No books match this filter."
              : `${filtered.length} book${filtered.length === 1 ? "" : "s"}`}
          </p>
        )}

        {/* Book grid — aria-live so screen readers announce changes */}
        <div aria-live="polite" aria-busy={isLoading}>
          <BookList books={filtered} isLoading={isLoading} error={error ?? null} />
        </div>
      </main>
    </div>
  );
}
