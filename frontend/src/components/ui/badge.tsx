import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        /** Reading — indigo palette, verified WCAG AA in light + dark */
        default:
          "bg-badge-reading-bg text-badge-reading-fg",
        /** Read — green palette, verified WCAG AA in light + dark */
        secondary:
          "bg-badge-done-bg text-badge-done-fg",
        /** Want to Read — blue palette, verified WCAG AA in light + dark */
        want:
          "bg-badge-want-bg text-badge-want-fg",
        /** Unselected pill option in StatusPillRow */
        outline:
          "border border-border text-secondary",
        /** Error / destructive usage */
        destructive:
          "bg-error-surface text-error-text",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={twMerge(clsx(badgeVariants({ variant }), className))}
      {...props}
    />
  );
}
