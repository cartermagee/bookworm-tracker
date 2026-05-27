import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={twMerge(
        clsx(
          // Layout & shape
          "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
          // Placeholder
          "placeholder:text-secondary",
          // Focus ring — 3px gap so ring is visible on any surface
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        ),
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
