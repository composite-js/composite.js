import dropoutseer from "./example-snippets/dropoutseer.txt?raw";
import iforum from "./example-snippets/iforum.txt?raw";
import mirror from "./example-snippets/mirror.txt?raw";
import nobel from "./example-snippets/nobel.txt?raw";
import olympic from "./example-snippets/olympic.txt?raw";
import upset from "./example-snippets/upset.txt?raw";

const snippets = {
  dropoutseer,
  iforum,
  mirror,
  nobel,
  olympic,
  upset,
};

export function getExampleSnippet(example) {
  const source = example.source || example.slug;
  const snippet = snippets[source];

  if (!snippet) {
    throw new Error(`Missing editable snippet for example: ${source}`);
  }

  return snippet.trim();
}
