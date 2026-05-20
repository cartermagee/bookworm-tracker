/**
 * Generated TypeScript types for the Bookworm Tracker API.
 *
 * Phase 1: hand-written to match the master prompt §4 contract. The committed
 * `openapi.json` snapshot only contains request shapes because the Phase 1
 * endpoints return TypedResults.Problem(501); response shapes appear once
 * Phase 2 handlers return real DTOs.
 *
 * Phase 2: regenerate with `pnpm gen:types`. CI will fail if this file would
 * change relative to the freshly-generated output (see ADR-0015 / locked-decision memo).
 *
 * Do NOT edit by hand after Phase 2; treat as generated.
 */

export type BookStatus = "WantToRead" | "Reading" | "Read";

export interface Book {
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

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string | null;
  coverUrl?: string | null;
  openLibraryWorkId?: string | null;
  status: BookStatus;
  rating?: number | null;
  notes?: string | null;
  dateFinished?: string | null;
}

export type UpdateBookRequest = CreateBookRequest;

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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

export type OpenLibraryBookMetadata = OpenLibrarySearchResult;

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string | null;
  instance: string | null;
  traceId: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  db: "ok" | "error";
}
