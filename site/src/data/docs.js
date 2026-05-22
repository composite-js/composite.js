import { MARK_DEFINITIONS } from "../../../src/mark/validation.js";

export const markNavItems = Object.keys(MARK_DEFINITIONS).map((mark) => ({
  href: `/docs/marks/#${mark}`,
  label: mark,
}));

export const docsNavItems = [
  { href: "/docs/", label: "Overview" },
  { href: "/docs/getting-started/", label: "Getting Started" },
  { href: "/docs/concepts/", label: "Concepts" },
  { href: "/docs/api/", label: "API" },
  { href: "/docs/marks/", label: "Marks", children: markNavItems },
  { href: "/docs/patterns/", label: "Patterns" },
];

export const docsCards = [
  {
    href: "/docs/getting-started/",
    label: "Getting Started",
    summary:
      "Install the package, create chart leaves, compose a view, and render it.",
  },
  {
    href: "/docs/concepts/",
    label: "Core Concepts",
    summary:
      "Understand layout nodes, recursive composition, repeats, embedding, and alignment.",
  },
  {
    href: "/docs/api/",
    label: "Composition API",
    summary:
      "Reference the factory functions used to build and render layout trees.",
  },
  {
    href: "/docs/marks/",
    label: "Marks",
    summary:
      "Review supported chart marks, encoding channels, and mark-specific options.",
  },
  {
    href: "/docs/patterns/",
    label: "Patterns",
    summary:
      "Apply short recipes for stacks, small multiples, embedded layouts, and annotations.",
  },
];
