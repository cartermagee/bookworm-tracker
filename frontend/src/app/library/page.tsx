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

        <BookList books={filtered} isLoading={isLoading} error={error ?? null} />
      </main>
    </div>
  );
}
