"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBook, useOpenLibrarySearch } from "@/lib/api/queries";
import { createBookSchema, type CreateBookInput } from "@/lib/validation/book";
import type { OpenLibrarySearchResult } from "@/lib/api/dtos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewBookPage() {
  const router = useRouter();
  const createBook = useCreateBook();

  // Open Library search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults, isLoading: isSearching } =
    useOpenLibrarySearch(searchQuery, showResults);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookInput>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      status: "WantToRead",
      isbn: null,
      coverUrl: null,
      openLibraryWorkId: null,
      rating: null,
      notes: null,
      dateFinished: null,
    },
  });

  const status = watch("status");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
    setShowResults(true);
  }

  function applyResult(result: OpenLibrarySearchResult) {
    setValue("title", result.title);
    setValue("author", result.author);
    setValue("isbn", result.isbn ?? null);
    setValue("coverUrl", result.coverUrl ?? null);
    setValue("openLibraryWorkId", result.workId);
    setShowResults(false);
    setSearchInput("");
    setSearchQuery("");
  }

  async function onSubmit(data: CreateBookInput) {
    try {
      await createBook.mutateAsync({
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
      router.push("/library");
    } catch {
      // error displayed via createBook.error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-xl font-semibold">Add a Book</h1>
          <Link href="/library">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6 space-y-6">
        {/* Open Library Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Open Library</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by title or author…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchInput.length < 3}>
                Search
              </Button>
            </form>

            {isSearching && (
              <p className="mt-3 text-sm text-gray-500">Searching…</p>
            )}

            {showResults &&
              !isSearching &&
              searchResults &&
              searchResults.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
                  {searchResults.map((result) => (
                    <li key={result.workId}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        onClick={() => applyResult(result)}
                      >
                        {result.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic; next/image requires known dimensions or remotePatterns for every CDN
                          <img
                            src={result.coverUrl}
                            alt={result.title}
                            className="h-12 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-100 text-lg">
                            📖
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{result.title}</p>
                          <p className="text-xs text-gray-500">
                            {result.author}
                            {result.firstPublishYear
                              ? ` · ${result.firstPublishYear}`
                              : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

            {showResults &&
              !isSearching &&
              searchResults &&
              searchResults.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  No results found. Fill in the form manually below.
                </p>
              )}
          </CardContent>
        </Card>

        {/* Book Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Book title"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  placeholder="Author name"
                  {...register("author")}
                />
                {errors.author && (
                  <p className="text-sm text-red-600">
                    {errors.author.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  placeholder="978-0-000-00000-0"
                  {...register("isbn")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="coverUrl">Cover URL</Label>
                <Input
                  id="coverUrl"
                  type="url"
                  placeholder="https://…"
                  {...register("coverUrl")}
                />
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
                      <option value="WantToRead">Want to Read</option>
                      <option value="Reading">Reading</option>
                      <option value="Read">Read</option>
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
                  placeholder="Optional"
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

              {status === "Read" && (
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
                  placeholder="Your thoughts…"
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("notes")}
                />
              </div>

              {createBook.error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createBook.error.message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || createBook.isPending}
                >
                  {createBook.isPending ? "Saving…" : "Add Book"}
                </Button>
                <Link href="/library">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
