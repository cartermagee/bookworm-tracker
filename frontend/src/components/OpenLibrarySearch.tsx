"use client";
import { useState } from "react";
import { useOpenLibrarySearch } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OpenLibrarySearchResult = components["schemas"]["OpenLibrarySearchResult"];

interface OpenLibrarySearchProps {
  onSelect: (result: OpenLibrarySearchResult) => void;
}

export function OpenLibrarySearch({ onSelect }: OpenLibrarySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults, isLoading: isSearching } =
    useOpenLibrarySearch(searchQuery, showResults);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
    setShowResults(true);
  }

  function handleSelect(result: OpenLibrarySearchResult) {
    onSelect(result);
    setShowResults(false);
    setSearchInput("");
    setSearchQuery("");
  }

  const hasResults =
    showResults && !isSearching && searchResults && searchResults.length > 0;
  const noResults =
    showResults && !isSearching && searchResults && searchResults.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search Open Library</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSearch}
          className="flex gap-2"
          role="search"
          aria-label="Search Open Library for books"
        >
          <Input
            placeholder="Search by title or author…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
            aria-label="Book search query"
          />
          <Button
            type="submit"
            disabled={searchInput.length < 3}
            aria-label="Search"
          >
            Search
          </Button>
        </form>

        {/* Live region for screen readers */}
        <div aria-live="polite" aria-atomic="true">
          {isSearching && (
            <p className="mt-3 text-sm text-secondary">Searching…</p>
          )}

          {hasResults && (
            <ul
              className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface"
              aria-label="Search results — select a book to fill in the form"
            >
              {searchResults!.map((result) => (
                <li key={result.workId}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-alt focus-visible:outline-none focus-visible:bg-surface-alt rounded-lg transition-colors"
                    onClick={() => handleSelect(result)}
                    aria-label={`Select ${result.title} by ${result.author}${result.firstPublishYear ? `, published ${result.firstPublishYear}` : ""}`}
                  >
                    {result.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- cover URLs are external dynamic
                      <img
                        src={result.coverUrl}
                        alt=""
                        aria-hidden="true"
                        className="h-12 w-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-surface-alt text-lg"
                      >
                        📖
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-secondary">
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

          {noResults && (
            <p className="mt-3 text-sm text-secondary">
              No results found. Fill in the form manually below.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
