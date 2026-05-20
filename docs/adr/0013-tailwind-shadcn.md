# ADR-0013: Tailwind CSS + shadcn/ui + react-hook-form + Zod

**Status:** Accepted
**Date:** 2026-05-19

## Context

Frontend styling and component approaches for a Next.js app:

- **Tailwind only:** Utility-first CSS; build all primitives from scratch. Accessible dialogs/dropdowns/comboboxes are hard to get right.
- **Component library (MUI, Mantine, Chakra):** Fast to ship; locked into the library's design language and update cycle.
- **CSS Modules / vanilla CSS:** Maximum portability; maximum effort for an app with forms.
- **Tailwind + shadcn/ui:** Utility-first layout plus accessible component primitives copied (not imported) into the repo.

shadcn/ui's mechanism is the distinguishing feature: `npx shadcn add dialog` copies the source of an accessible component (built on Radix UI primitives, styled with Tailwind) directly into the repo. There is no runtime `@shadcn/ui` dependency.

## Decision

Tailwind CSS + shadcn/ui (with the components listed in the master prompt §3 added at scaffold time). React Hook Form + Zod for form state, integrated via shadcn's `<Form>` component. `next-themes` for dark mode wired from day one.

Zod schemas mirror the backend's FluentValidation rules but are deliberately the **less strict** layer — they enforce immediate UX feedback; the server is authoritative.

## Consequences

- Accessibility (focus, ARIA, keyboard, screen reader) is handled by Radix primitives — the part hand-rolled components most often get wrong.
- No vendor lock-in: every component in `/components/ui/` is editable code in the repo.
- Tailwind handles all layout and custom styling; the design language is ours, not a library's.
- shadcn primitives must not be modified in Phase 2 — restyle via `className` from consumers. Pristine primitives keep upgrade paths and reviewer expectations clean.
- Dark mode retrofitting is painful; wiring it from day one (even without a visible toggle) avoids that cost.
- Component libraries (MUI et al.) were rejected because they lock the design language and create a passenger relationship with their update cycle. For a learning project, the explicit ownership of shadcn components teaches more.
