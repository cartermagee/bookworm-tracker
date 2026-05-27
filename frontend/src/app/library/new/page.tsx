"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateBook } from "@/lib/api/queries";
import type { components } from "@/lib/api/types";

type OpenLibrarySearchResult = components["schemas"]["OpenLibrarySearchResult"];
import { BookForm, type BookFormHandle, type BookFormValues } from "@/components/BookForm";
import { OpenLibrarySearch } from "@/components/OpenLibrarySearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewBookPage() {
  const router = useRouter();
  const createBook = useCreateBook();
  const bookFormRef = useRef<BookFormHandle>(null);

  function handleSelect(result: OpenLibrarySearchResult) {
    bookFormRef.current?.setValue("title", result.title);
    bookFormRef.current?.setValue("author", result.author);
    bookFormRef.current?.setValue("isbn", result.isbn ?? null);
    bookFormRef.current?.setValue("coverUrl", result.coverUrl ?? null);
    bookFormRef.current?.setValue("openLibraryWorkId", result.workId);
  }

  async function onSubmit(data: BookFormValues) {
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Add a Book</h1>
          <Link href="/library">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl space-y-6 p-6">
        <OpenLibrarySearch onSelect={handleSelect} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <BookForm
              ref={bookFormRef}
              defaultValues={{
                status: "wantToRead",
                isbn: null,
                coverUrl: null,
                openLibraryWorkId: null,
                rating: null,
                notes: null,
                dateFinished: null,
              }}
              onSubmit={onSubmit}
              isPending={createBook.isPending}
              error={createBook.error}
              submitLabel="Add Book"
              onCancel={() => router.push("/library")}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
