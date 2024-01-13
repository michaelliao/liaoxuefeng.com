# Digital Timing

To create a digital timing diagram (wave form), add text inside a fenced code block with the `wavedrom` identifier.

GitSite uses [wavedrom](https://github.com/wavedrom/wavedrom) to render digital timing diagrams. Wavedrom is an open source, JavaScript-based library that makes it easy to render digital timing diagrams into SVG vector graphics.

    ```wavedrom
    { signal: [
      { name: "clk",  wave: "p.....|..." },
      { name: "data", wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
      { name: "req",  wave: "0.1..0|1.0" },
      {},
      { name: "ack",  wave: "1.....|01." }
    ]}
    ```

```wavedrom
{ signal: [
  { name: "clk",  wave: "p.....|..." },
  { name: "data", wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
  { name: "req",  wave: "0.1..0|1.0" },
  {},
  { name: "ack",  wave: "1.....|01." }
]}
```

You can specify the alignment by `align=center`.

```alert type=tip
Use the [wavedrom online editor](https://wavedrom.com/editor.html) to edit your digital timing digram.
```
