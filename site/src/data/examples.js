export const examples = [
  {
    slug: "upset",
    title: "UpSet",
    summary: "A stacked matrix view with bars and repeated pies.",
    tags: ["stackY", "stackX", "repeatX"],
    dataFiles: [
      "upset/intersections.csv",
      "upset/boxes.csv",
      "upset/stacks.csv",
      "upset/pies.csv",
    ],
  },
  {
    slug: "dropoutseer",
    title: "DropoutSeer",
    summary: "A domain example for comparing grouped visual components.",
    tags: ["composition", "analysis"],
    dataFiles: [
      "dropoutseer/learners.csv",
      "dropoutseer/sequence.csv",
      "dropoutseer/flow.csv",
      "dropoutseer/bars.csv",
    ],
  },
  {
    slug: "olympic",
    title: "Olympic",
    summary: "A composite view built around Olympic-style data.",
    tags: ["charts", "comparison"],
    dataFiles: ["olympic/games.csv", "olympic/sports.csv"],
  },
  {
    slug: "nobel",
    title: "Nobel",
    summary: "A composed visualization for Nobel-related records.",
    tags: ["layout", "records"],
    dataFiles: ["nobel/fields.csv", "nobel/ages.csv", "nobel/education.csv"],
  },
  {
    slug: "iforum",
    title: "iForum",
    summary: "A multi-part example organized through layout nodes.",
    tags: ["layout", "embedding"],
    dataFiles: ["iforum/streams.csv", "iforum/bars.csv", "iforum/boxes.csv"],
  },
  {
    slug: "mirror",
    title: "Mirror",
    summary: "A paired layout example for mirrored comparisons.",
    tags: ["alignment", "comparison"],
    dataFiles: ["mirror.csv"],
  },
  {
    slug: "rainfall",
    title: "Rainfall",
    summary: "A seasonal rainfall example with a custom bubble grid.",
    tags: ["custom", "repeatX", "stackY"],
    dataFiles: ["rainfall/monthly.csv", "rainfall/yearly.csv"],
    featured: false,
  },
  {
    slug: "country",
    title: "Country",
    summary:
      "A country comparison layout combining flags, bars, and pac marks.",
    tags: ["image", "bar", "pac"],
    dataFiles: ["country.csv"],
    featured: false,
  },
  {
    slug: "scatterplotmatrix",
    title: "Scatterplot Matrix",
    summary: "An Iris pairwise scatterplot matrix with embedded grid cells.",
    tags: ["scatter", "embed", "repeat"],
    dataFiles: ["iris.csv"],
    featured: false,
  },
  {
    slug: "mediafears",
    title: "Media-Inflamed Fears",
    summary: "Aligned area-chart lanes showing synthetic attention over time.",
    tags: ["area", "repeatY", "small multiples"],
    dataFiles: ["mediafears.csv"],
    featured: false,
  },
];

export const featuredExamples = examples.filter(
  (example) => example.featured !== false,
);

export function getExampleBySlug(slug) {
  return examples.find((example) => example.slug === slug);
}
