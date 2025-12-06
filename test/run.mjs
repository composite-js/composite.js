import { compose } from "../src/index.js";

const add1 = (x) => x + 1;
const dbl = (x) => x * 2;

const fn = compose(add1, dbl);

console.log("compose(add1, dbl)(3) =>", fn(3));
