"use client";
import { type ReactNode } from "react";
import { m } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authCard } from "@/lib/motion/variants";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

/**
 * Shared animated wrapper for the login and register pages.
 * Renders the full-screen centred layout, framer-motion entrance,
 * Card header with 📚 emoji, and the card body slot.
 */
export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <m.div
        variants={authCard}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center pb-2">
            <p aria-hidden="true" className="text-3xl mb-1 select-none">
              📚
            </p>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </m.div>
    </main>
  );
}
