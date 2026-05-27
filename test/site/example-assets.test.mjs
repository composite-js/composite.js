import assert from "node:assert/strict";
import { examples, featuredExamples } from "../../site/src/data/examples.js";

{
  assert.equal(examples[0]?.slug, "upset");
  assert.equal(examples[0]?.source, undefined);

  examples.forEach((example) => {
    assert.equal(
      example.image,
      undefined,
      `${example.slug} should rely on live browser previews, not static image assets`,
    );
  });
}

{
  const rainfall = examples.find((example) => example.slug === "rainfall");

  assert.ok(rainfall, "Rainfall should be registered in site examples");
  assert.equal(rainfall.featured, false);
  assert.ok(
    !featuredExamples.some((example) => example.slug === "rainfall"),
    "Rainfall should not appear in homepage featured examples",
  );
}

{
  const country = examples.find((example) => example.slug === "country");

  assert.ok(country, "Country should be registered in site examples");
  assert.equal(country.featured, false);
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
  assert.ok(
    !featuredExamples.some((example) => example.slug === "scatterplotmatrix"),
    "Scatterplot Matrix should not appear in homepage featured examples",
  );
}
