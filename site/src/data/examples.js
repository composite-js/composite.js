export const examples = [
  {
    slug: "upset-style",
    source: "index",
    title: "UpSet-style composition",
    summary: "A stacked matrix view with bars and repeated pies.",
    image: "/examples/upset-style.svg",
    tags: ["stackY", "stackX", "repeatX"],
  },
  {
    slug: "dropoutseer",
    title: "DropoutSeer",
    summary: "A domain example for comparing grouped visual components.",
    image: "/examples/dropoutseer.svg",
    tags: ["composition", "analysis"],
  },
  {
    slug: "olympic",
    title: "Olympic",
    summary: "A composite view built around Olympic-style data.",
    image: "/examples/olympic.svg",
    tags: ["charts", "comparison"],
  },
  {
    slug: "nobel",
    title: "Nobel",
    summary: "A composed visualization for Nobel-related records.",
    image: "/examples/nobel.svg",
    tags: ["layout", "records"],
  },
  {
    slug: "iforum",
    title: "iForum",
    summary: "A multi-part example organized through layout nodes.",
    image: "/examples/iforum.svg",
    tags: ["layout", "embedding"],
  },
  {
    slug: "mirror",
    title: "Mirror",
    summary: "A paired layout example for mirrored comparisons.",
    image: "/examples/mirror.svg",
    tags: ["alignment", "comparison"],
  },
];

export function getExampleBySlug(slug) {
  return examples.find((example) => example.slug === slug);
}
