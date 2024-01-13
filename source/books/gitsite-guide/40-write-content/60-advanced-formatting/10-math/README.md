# Mathematical Expressions

To enable clear communication of mathematical expressions, GitSite supports LaTeX formatted math within Markdown. For more information, see [LaTeX/Mathematics](http://en.wikibooks.org/wiki/LaTeX/Mathematics) in Wikibooks.

GitSite's math rendering capability uses [Katex](https://katex.org/): an open source, JavaScript-based display engine.

## Writing inline expressions

You can surround the expression with dollar symbols `$`.

```markdown
This sentence uses `$` delimiters to show math inline:  $\sqrt{3x-1}+(1+x)^2$.
```

This sentence uses `$` delimiters to show math inline:  $\sqrt{3x-1}+(1+x)^2$.

## Writing expressions as blocks

To add a math expression as a block, add expression inside a fenced code block with the `math` identifier.

    ```math
    \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
    ```

```math
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
```

You can set the alignment to center or right. For example, use `align=center` to set alignment to center:

    ```math align=center
    \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
    ```

```math align=center
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
```

You can still use GitHub-styled math expression block by start a new line and delimit the expression with two dollar symbols `$$`, but you cannot set alignment by this way (always display in center):

```markdown
$$
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$
```

$$
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$

```alert type=tip
Use the [visual editor](https://demo.wiris.com/mathtype/en/developers.php#mathml-latex) provided by Wiris can help you write math expressions much easier.
```

## Writing chemical equations

The Katex also supports chemical equations by the [mhchem](https://mhchem.github.io/MathJax-mhchem/) extension.

```markdown
Chemical equation example: $\ce{CO2 + C -> 2 CO}$.
```

Chemical equation example: $\ce{CO2 + C -> 2 CO}$.

A complex chemical equation as a block:

    ```math
    \ce{Hg^2+ ->[I-] HgI2 ->[I-] [Hg^{II}I4]^2-}
    ```

```math
\ce{Hg^2+ ->[I-] HgI2 ->[I-] [Hg^{II}I4]^2-}
```
