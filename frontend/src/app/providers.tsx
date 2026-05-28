"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/*
       * LazyMotion + domAnimation: loads only the features we use
       * (layout, gestures, transitions) without the full motion bundle.
       * All motion components must use `m` (not `motion`) so the split
       * can be enforced at build time.
       */}
      <LazyMotion features={domAnimation}>
        {/*
         * reducedMotion="user": respects prefers-reduced-motion at runtime
         * (ADA requirement) AND makes Playwright tests reliable — when
         * playwright.config sets reducedMotion: "reduce", Framer Motion
         * jumps straight to the final animation state so no element is
         * ever invisible due to RAF throttling in headless Chromium.
         */}
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
