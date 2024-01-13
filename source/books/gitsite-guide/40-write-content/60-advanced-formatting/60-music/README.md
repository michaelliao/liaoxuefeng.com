# Music

To create a sheet music, add text inside a fenced code block with the `abcjs` identifier.

GitSite uses [abcjs](https://paulrosen.github.io/abcjs/) to render sheet music. Abcjs is an open source, JavaScript-based library that makes it easy to incorporate sheet music on websites.

You have to add the JavaScript because it cannot be rendered offline:

```html
<script src="/static/abcjs-basic.js"></script>
<script src="/static/abcjs-init.js"></script>
```

The Abc notation inside the fenced code block will be converted to a sheet music:

    ```abcjs max-width=640
    T: Cooley's
    M: 4/4
    Q: 1/4=120
    L: 1/8
    R: reel
    K: Emin
    |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
    EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
    |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
    eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
    ```

```abcjs max-width=640
T: Cooley's
M: 4/4
Q: 1/4=120
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
```

You can specify the max width by `max-width=640` and the alignment by `align=center`. The really interesting thing is that you can play the music by `controls` instruction:

    ```abcjs max-width=640 align=center controls
    T: Cooley's
    M: 4/4
    Q: 1/4=120
    L: 1/8
    R: reel
    K: Emin
    |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
    EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
    |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
    eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
    ```

```abcjs max-width=640 align=center controls
T: Cooley's
M: 4/4
Q: 1/4=120
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
```

```alert type=tip
The offical abcjs website provides a [live editor with synth](https://paulrosen.github.io/abcjs/examples/editor-synth.html), so you can edit your sheet and check if it has errors.
```
