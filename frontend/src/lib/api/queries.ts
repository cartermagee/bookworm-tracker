"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateBook,
  apiDeleteBook,
  apiGetBook,
  apiListBooks,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiSearchOpenLibrary,
  apiUpdateBook,
  type CreateBookPayload,
} from "./client";
import type { BookDto, MeResponse, OpenLibrarySearchResult } from "./dtos";

export const queryKeys = {
  books: ["books"] as const,
  book: (id: string) => ["books", id] as const,
  me: ["me"] as const,
  openLibrarySearch: (q: string) => ["open-library", "search", q] as const,
};

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const r = await apiMe();
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("Failed to fetch user");
      return r.json() as Promise<MeResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.books });
      void qc.invalidateQueries({ queryKey: queryKeys.book(id) });
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
