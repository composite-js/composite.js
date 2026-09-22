import { CHART_TYPE_DEFINITIONS } from "../../../src/chart/validation.js";

export const markNavItems = Object.keys(CHART_TYPE_DEFINITIONS).map((mark) => ({
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
      "Define charts, express a relationship, and render with layout defaults.",
  },
  {
    href: "/docs/concepts/",
    label: "Core Concepts",
    summary:
      "Understand abstract relationships, automatic layout, and recursive composition.",
  },
  {
    href: "/docs/api/",
    label: "Composition API",
    summary: "Reference composition factories and optional layout controls.",
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
      "Translate common relationships between charts into composition code.",
  },
];
