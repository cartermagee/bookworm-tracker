// Phase 2: real TanStack Query hooks (useBooks, useCreateBook, useUpdateBook, ...).
// Phase 1: query keys are defined so Phase 2 has a stable place to import from.

export const queryKeys = {
  books: ["books"] as const,
  book: (id: string) => ["books", id] as const,
  me: ["me"] as const,
  openLibrarySearch: (q: string) => ["open-library", "search", q] as const,
};
