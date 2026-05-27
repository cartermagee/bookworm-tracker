import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type LabelHTMLAttributes, forwardRef } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={twMerge(
        clsx(
          "text-sm font-medium text-foreground leading-none",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className,
        ),
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";
