// Response DTOs matching the backend BookTracker.Api shapes.
// These mirror what types.ts will contain after gen:types runs post-merge.

export type BookStatus = "WantToRead" | "Reading" | "Read";

export interface BookDto {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  openLibraryWorkId: string | null;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  dateAdded: string;
  dateFinished: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
}

export interface OpenLibrarySearchResult {
  workId: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  firstPublishYear: number | null;
}

export interface OpenLibraryBookMetadata {
  workId: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  firstPublishYear: number | null;
}

export interface ProblemDetails {
  title: string;
  status: number;
  detail?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}
