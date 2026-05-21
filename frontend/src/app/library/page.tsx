"use client";
import { useState } from "react";
import Link from "next/link";
import { useBooks, useLogout } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";

type BookStatus = components["schemas"]["BookStatus"];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-semibold">Bookworm</h1>
          <div className="flex gap-2">
            <Link href="/library/new">
              <Button size="sm">+ Add Book</Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        {/* Filter + Sort controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "wantToRead", "reading", "read"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant={sort === "dateAdded" ? "default" : "outline"}
              onClick={() => setSort("dateAdded")}
            >
              Newest
            </Button>
            <Button
              size="sm"
              variant={sort === "title" ? "default" : "outline"}
              onClick={() => setSort("title")}
            >
              Title
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-gray-500">Loading your library…</p>}
        {error && (
          <p className="text-red-600">
            Failed to load books: {error.message}
          </p>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <p className="text-lg">Your library is empty.</p>
            <Link href="/library/new">
              <Button className="mt-4">Add your first book</Button>
            </Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((book) => (
            <Link key={book.id} href={`/library/${book.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-4">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic; next/image requires known dimensions or remotePatterns for every CDN
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-20 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-14 items-center justify-center rounded bg-gray-100 text-2xl">
                      📖
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <p className="font-medium leading-tight">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <Badge variant={STATUS_BADGE_VARIANT[book.status]}>
                        {STATUS_LABELS[book.status]}
                      </Badge>
                      {book.rating != null && (
                        <span className="text-xs text-gray-500">
                          {"★".repeat(book.rating)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
