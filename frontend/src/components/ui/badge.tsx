import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-800",
        secondary: "bg-gray-100 text-gray-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-gray-300 text-gray-700",
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
