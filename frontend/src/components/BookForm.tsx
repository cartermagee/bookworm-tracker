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

/* Shared classes for form controls (input, select, textarea) */
const fieldClass =
  "flex w-full rounded-md border border-border bg-surface text-foreground px-3 py-2 text-sm " +
  "placeholder:text-secondary " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-50";

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="title">Title <span aria-hidden="true">*</span></Label>
          <Input
            id="title"
            placeholder="Book title"
            aria-required="true"
            aria-describedby={errors.title ? "title-error" : undefined}
            {...register("title")}
          />
          {errors.title && (
            <p id="title-error" role="alert" className="text-sm text-error-text">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Author */}
        <div className="space-y-1">
          <Label htmlFor="author">Author <span aria-hidden="true">*</span></Label>
          <Input
            id="author"
            placeholder="Author name"
            aria-required="true"
            aria-describedby={errors.author ? "author-error" : undefined}
            {...register("author")}
          />
          {errors.author && (
            <p id="author-error" role="alert" className="text-sm text-error-text">
              {errors.author.message}
            </p>
          )}
        </div>

        {/* ISBN */}
        <div className="space-y-1">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            placeholder="978-0-000-00000-0"
            {...register("isbn")}
          />
        </div>

        {/* Cover URL */}
        <div className="space-y-1">
          <Label htmlFor="coverUrl">Cover URL</Label>
          <Input
            id="coverUrl"
            type="url"
            placeholder="https://…"
            aria-describedby={errors.coverUrl ? "coverUrl-error" : undefined}
            {...register("coverUrl")}
          />
          {errors.coverUrl && (
            <p id="coverUrl-error" role="alert" className="text-sm text-error-text">
              {errors.coverUrl.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="status">Status <span aria-hidden="true">*</span></Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select
                id="status"
                aria-required="true"
                className={`${fieldClass} h-10`}
                {...field}
              >
                <option value="wantToRead">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
              </select>
            )}
          />
        </div>

        {/* Rating */}
        <div className="space-y-1">
          <Label htmlFor="rating">Rating (1–5)</Label>
          <Input
            id="rating"
            type="number"
            min={1}
            max={5}
            placeholder="Optional"
            aria-describedby={errors.rating ? "rating-error" : undefined}
            {...register("rating", {
              setValueAs: (v: unknown) =>
                v === "" || v == null ? null : parseInt(String(v), 10),
            })}
          />
          {errors.rating && (
            <p id="rating-error" role="alert" className="text-sm text-error-text">
              {errors.rating.message}
            </p>
          )}
        </div>

        {/* Date finished — only shown when status = read */}
        {status === "read" && (
          <div className="space-y-1">
            <Label htmlFor="dateFinished">
              Date Finished <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="dateFinished"
              type="date"
              aria-required="true"
              aria-describedby={errors.dateFinished ? "dateFinished-error" : undefined}
              {...register("dateFinished", {
                setValueAs: (v: unknown) =>
                  v === "" || v == null
                    ? null
                    : new Date(String(v)).toISOString(),
              })}
            />
            {errors.dateFinished && (
              <p id="dateFinished-error" role="alert" className="text-sm text-error-text">
                {errors.dateFinished.message}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Your thoughts…"
            className={fieldClass}
            {...register("notes")}
          />
        </div>

        {/* Mutation error */}
        {error && (
          <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error-text">
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
