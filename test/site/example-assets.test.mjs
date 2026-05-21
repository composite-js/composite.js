import assert from "node:assert/strict";
import { examples } from "../../site/src/data/examples.js";

{
  assert.equal(examples[0]?.slug, "upset");
  assert.equal(examples[0]?.source, undefined);
  assert.equal(examples[0]?.image, "/examples/upset.svg");

  examples.forEach((example) => {
    assert.ok(example.image, `${example.slug} should define an image asset`);
    assert.match(example.image, /^\/examples\/[a-z0-9-]+\.svg$/);
  });
}
