You should follow these instructions when editing code.

1. All code is executed under a browser environment.
2. Use English for annotations. (No Chinese is allowed in your code)

---

## Project Descriptions

This is a visualization grammar written in javascript (Node.js).
It is used to help people create composite visualizations.

> What is composite visualization?
> It combines basic charts (e.g., bar chart, line chart, matrix) in a meaningful layout, together to show multiple facets of the data. To combine basic charts, there are many strategies, such as **stacking**, **repeating**, **mirroring**, **connecting**, **embedding**.
>
> Composition can appear several times in a visualization, for example, first repeating some small multiples, then stacking this group to another chart. This means that, the final composite visualization can be represented as a tree structure, where root node is the final composite visualization, leaf nodes represent basic charts, and non-leaf nodes represent intermediate compositions.
>
> Each node can be rendered independently (by calling the `.render()` function).
