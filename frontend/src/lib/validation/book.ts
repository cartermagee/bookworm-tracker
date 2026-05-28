import { z } from "zod";

const bookStatus = z.enum(["wantToRead", "reading", "read"]);

const baseBookFields = {
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(200),
  isbn: z.string().max(20).nullable().optional(),
  coverUrl: z.string().url().max(500).nullable().optional(),
  openLibraryWorkId: z.string().max(50).nullable().optional(),
  status: bookStatus,
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  dateFinished: z.string().datetime().nullable().optional(),
};

export const createBookSchema = z
  .object(baseBookFields)
  .refine(
    (v) =>
      v.status === "read"
        ? v.dateFinished != null
        : v.dateFinished == null,
    {
      message: "dateFinished is required when status is 'Read' and must be null otherwise.",
      path: ["dateFinished"],
    },
  );

export type CreateBookInput = z.infer<typeof createBookSchema>;
