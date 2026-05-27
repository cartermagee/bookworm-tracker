import type { Variants, TargetAndTransition } from "framer-motion";

/**
 * Shared Framer Motion variants for Bookworm Tracker.
 *
 * All timing uses spring physics so animations feel physical rather
 * than mechanical. Import what you need — tree-shaking keeps unused
 * variants out of the bundle.
 */

/** Parent container that staggers its children on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren:   0.04,
    },
  },
};

/** Book card: rises 16 px + fades in; shrinks + fades on exit. */
export const bookCard = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.14, ease: "easeIn" },
  },
} satisfies Variants & { exit: TargetAndTransition };

/** App header: slides down from above. */
export const headerSlideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30 },
  },
};

/** Main content area: fades up with a short delay so header leads. */
export const contentFadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      delay: 0.08,
    },
  },
};

/**
 * Hero book cover: springs in from a smaller scale.
 * Creates the "opening a book" feeling on the detail page.
 */
export const heroScale: Variants = {
  hidden: { opacity: 0, scale: 0.72 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

/** Detail page text block: rises just after the cover reveals. */
export const detailText: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      delay: 0.14,
    },
  },
};

/** Auth card (login / register): rises and fades in on mount. */
export const authCard: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 28 },
  },
};
