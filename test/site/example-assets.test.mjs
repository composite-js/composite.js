import assert from "node:assert/strict";
import { examples, featuredExamples } from "../../site/src/data/examples.js";

{
  assert.equal(examples[0]?.slug, "upset");
  assert.equal(examples[0]?.source, undefined);
  assert.equal(examples[0]?.image, "/examples/upset.svg");

  examples.forEach((example) => {
    assert.ok(example.image, `${example.slug} should define an image asset`);
    assert.match(example.image, /^\/examples\/[a-z0-9-]+\.svg$/);
  });
}

{
  const rainfall = examples.find((example) => example.slug === "rainfall");

  assert.ok(rainfall, "Rainfall should be registered in site examples");
  assert.equal(rainfall.featured, false);
  assert.equal(rainfall.image, "/examples/rainfall.svg");
  assert.ok(
    !featuredExamples.some((example) => example.slug === "rainfall"),
    "Rainfall should not appear in homepage featured examples",
  );
}

{
  const country = examples.find((example) => example.slug === "country");

  assert.ok(country, "Country should be registered in site examples");
  assert.equal(country.featured, false);
  assert.equal(country.image, "/examples/country.svg");
  assert.ok(
    !featuredExamples.some((example) => example.slug === "country"),
    "Country should not appear in homepage featured examples",
  );
}

{
  const scatterplotmatrix = examples.find(
    (example) => example.slug === "scatterplotmatrix",
  );

  assert.ok(
    scatterplotmatrix,
    "Scatterplot Matrix should be registered in site examples",
  );
  assert.equal(scatterplotmatrix.featured, false);
  assert.equal(scatterplotmatrix.image, "/examples/scatterplotmatrix.svg");
  assert.ok(
    !featuredExamples.some((example) => example.slug === "scatterplotmatrix"),
    "Scatterplot Matrix should not appear in homepage featured examples",
  );
}
