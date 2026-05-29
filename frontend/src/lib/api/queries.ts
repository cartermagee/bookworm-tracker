"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateBook,
  apiDeleteBook,
  apiGetBook,
  apiListBooks,
  apiLogin,
  apiLogout,
  apiRegister,
  apiSearchOpenLibrary,
  apiUpdateBook,
  type CreateBookPayload,
} from "./client";
import type { components } from "./types";

type BookDto = components["schemas"]["BookDto"];
type OpenLibrarySearchResult = components["schemas"]["OpenLibrarySearchResult"];

const queryKeys = {
  books: ["books"] as const,
  book: (id: string) => ["books", id] as const,
  me: ["me"] as const,
  openLibrarySearch: (q: string) => ["open-library", "search", q] as const,
};

export function useBooks() {
  return useQuery<BookDto[]>({
    queryKey: queryKeys.books,
    queryFn: async () => {
      const r = await apiListBooks();
      if (!r.ok) throw new Error("Failed to load books");
      return r.json() as Promise<BookDto[]>;
    },
  });
}

export function useBook(id: string) {
  return useQuery<BookDto>({
    queryKey: queryKeys.book(id),
    queryFn: async () => {
      const r = await apiGetBook(id);
      if (!r.ok) throw new Error("Book not found");
      return r.json() as Promise<BookDto>;
    },
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBookPayload) => {
      const r = await apiCreateBook(data);
      if (!r.ok) throw new Error("Failed to create book");
      return r.json() as Promise<BookDto>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.books }),
  });
}

export function useUpdateBook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBookPayload) => {
      const r = await apiUpdateBook(id, data);
      if (!r.ok) throw new Error("Failed to update book");
      return r.json() as Promise<BookDto>;
    },
    onSuccess: (updatedBook: BookDto) => {
      qc.setQueryData(queryKeys.book(id), updatedBook);
      void qc.invalidateQueries({ queryKey: queryKeys.books });
    },
  });
}

/** Single mutation for updating any book by id — use at page/list level
 *  to avoid one useMutation per card, which causes framer-motion animation
 *  interruption on mount. */
export function useUpdateAnyBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateBookPayload }) => {
      const r = await apiUpdateBook(id, data);
      if (!r.ok) throw new Error("Failed to update book");
      return r.json() as Promise<BookDto>;
    },
    onSuccess: (updatedBook: BookDto, { id }) => {
      qc.setQueryData(queryKeys.book(id), updatedBook);
      void qc.invalidateQueries({ queryKey: queryKeys.books });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await apiDeleteBook(id);
      if (!r.ok) throw new Error("Failed to delete book");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.books }),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const r = await apiLogin(email, password);
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { title?: string };
        throw new Error(err.title ?? "Login failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const r = await apiRegister(email, password);
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { title?: string };
        throw new Error(err.title ?? "Registration failed");
      }
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiLogout();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useOpenLibrarySearch(q: string, enabled: boolean) {
  return useQuery<OpenLibrarySearchResult[]>({
    queryKey: queryKeys.openLibrarySearch(q),
    queryFn: async () => {
      const r = await apiSearchOpenLibrary(q);
      if (!r.ok) throw new Error("Search failed");
      return r.json() as Promise<OpenLibrarySearchResult[]>;
    },
    enabled: enabled && q.length > 2,
    staleTime: 60 * 1000,
  });
}
