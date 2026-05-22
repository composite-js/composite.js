export const markNavItems = [
  "bar",
  "groupbar",
  "stackbar",
  "area",
  "line",
  "matrix",
  "scatter",
  "box",
  "bubble",
  "dumbbell",
  "pac",
  "pie",
  "flow",
  "stream",
].map((mark) => ({
  href: `/docs/marks/#${mark}`,
  label: mark,
}));

export const docsNavItems = [
  { href: "/docs/", label: "Overview" },
  { href: "/docs/concepts/", label: "Concepts" },
  { href: "/docs/api/", label: "API" },
  { href: "/docs/marks/", label: "Marks", children: markNavItems },
];

export const docsCards = [
  { href: "/docs/concepts/", label: "Concepts placeholder" },
  { href: "/docs/api/", label: "API placeholder" },
  { href: "/docs/marks/", label: "Marks placeholder" },
];
