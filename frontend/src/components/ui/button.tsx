import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  // Base: all buttons get these
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fg hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-fg hover:bg-destructive/90 " +
          "focus-visible:ring-destructive",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-alt",
        ghost:
          "text-foreground hover:bg-surface-alt",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8  px-3 text-xs",
        lg:      "h-12 px-8",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={twMerge(clsx(buttonVariants({ variant, size }), className))}
      {...props}
    />
  ),
);
Button.displayName = "Button";
