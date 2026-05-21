"use client";
import { forwardRef, useImperativeHandle } from "react";
import { useForm, Controller, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBookSchema, type CreateBookInput } from "@/lib/validation/book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BookFormValues = CreateBookInput;

export interface BookFormHandle {
  setValue: UseFormSetValue<BookFormValues>;
}

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (data: BookFormValues) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  submitLabel: string;
  onCancel?: () => void;
}

export const BookForm = forwardRef<BookFormHandle, BookFormProps>(
  function BookForm(
    { defaultValues, onSubmit, isPending, error, submitLabel, onCancel },
    ref,
  ) {
    const {
      register,
      handleSubmit,
      control,
      watch,
      setValue: rhfSetValue,
      formState: { errors, isSubmitting },
    } = useForm<BookFormValues>({
      resolver: zodResolver(createBookSchema),
      defaultValues: {
        status: "wantToRead",
        isbn: null,
        coverUrl: null,
        openLibraryWorkId: null,
        rating: null,
        notes: null,
        dateFinished: null,
        ...defaultValues,
      },
    });

    useImperativeHandle(ref, () => ({
      setValue: rhfSetValue,
    }));

    const status = watch("status");

    return (
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
            <p className="text-sm text-red-600">{errors.author.message}</p>
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
            <p className="text-sm text-red-600">{errors.coverUrl.message}</p>
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
                <option value="wantToRead">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
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
            <p className="text-sm text-red-600">{errors.rating.message}</p>
          )}
        </div>

        {status === "read" && (
          <div className="space-y-1">
            <Label htmlFor="dateFinished">Date Finished *</Label>
            <Input
              id="dateFinished"
              type="date"
              {...register("dateFinished", {
                setValueAs: (v: unknown) =>
                  v === "" || v == null
                    ? null
                    : new Date(String(v)).toISOString(),
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

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || isPending}>
            {isPending ? "Saving…" : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  },
);

BookForm.displayName = "BookForm";
