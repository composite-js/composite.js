export const examples = [
  {
    slug: "upset",
    title: "UpSet",
    summary: "A stacked matrix view with bars and repeated pies.",
    tags: ["stackY", "stackX", "repeatX"],
  },
  {
    slug: "dropoutseer",
    title: "DropoutSeer",
    summary: "A domain example for comparing grouped visual components.",
    tags: ["composition", "analysis"],
  },
  {
    slug: "olympic",
    title: "Olympic",
    summary: "A composite view built around Olympic-style data.",
    tags: ["charts", "comparison"],
  },
  {
    slug: "nobel",
    title: "Nobel",
    summary: "A composed visualization for Nobel-related records.",
    tags: ["layout", "records"],
  },
  {
    slug: "iforum",
    title: "iForum",
    summary: "A multi-part example organized through layout nodes.",
    tags: ["layout", "embedding"],
  },
  {
    slug: "mirror",
    title: "Mirror",
    summary: "A paired layout example for mirrored comparisons.",
    tags: ["alignment", "comparison"],
  },
  {
    slug: "rainfall",
    title: "Rainfall",
    summary: "A seasonal rainfall example with a custom bubble grid.",
    tags: ["custom", "repeatX", "stackY"],
    featured: false,
  },
  {
    slug: "country",
    title: "Country",
    summary:
      "A country comparison layout combining flags, bars, and pac marks.",
    tags: ["image", "bar", "pac"],
    featured: false,
  },
  {
    slug: "scatterplotmatrix",
    title: "Scatterplot Matrix",
    summary: "An Iris pairwise scatterplot matrix with embedded grid cells.",
    tags: ["scatter", "embed", "repeat"],
    featured: false,
  },
];

export const featuredExamples = examples.filter(
  (example) => example.featured !== false,
);

export function getExampleBySlug(slug) {
  return examples.find((example) => example.slug === slug);
}
