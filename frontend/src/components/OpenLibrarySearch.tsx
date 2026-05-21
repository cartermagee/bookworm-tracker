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

  return (
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
                    onClick={() => handleSelect(result)}
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
  );
}
