# Basic Syntax

## Headings

---

To create a heading, add 1 ~ 6 `#` symbols before your heading text.

A first-level heading has 1 `#` symbol, a second-level heading has 2 `#` symbols, and so on:

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Styling text

---

You can indicate emphasis with bold, italic, strikethrough, subscript, or superscript text in comment fields and .md files.

| Style         | Syntax         | Example                                  | Output                                 |
|---------------|----------------|------------------------------------------|----------------------------------------|
| Bold          | `** **`        | `This is a **bold** text.`               | This is a **bold** text.               |
| Italic        | `* *`          | `This is a *italic* text.`               | This is a *italic* text.               |
| Strikethrough | `~~ ~~`        | `This is ~~not~~ a good idea.`           | This is ~~not~~ a good idea.           |
| Subscript     | `<sub> </sub>` | `This is a <sub>subscript</sub> text.`   | This is a <sub>subscript</sub> text.   |
| Superscript   | `<sup> </sup>` | `This is a <sup>superscript</sup> text.` | This is a <sup>superscript</sup> text. |

## Quoting text

---

You can quote text with a `>`.

```markdown
> To be, or not to be, that is the question
> 
> -- Hamlet
```

> To be, or not to be, that is the question.
> 
> -- Hamlet

## Links

You can create an inline link by wrapping link text in brackets `[ ]`, and then wrapping the URL in parentheses `( )`.

```markdown
[License](/pages/license/index.html)

[GitHub](https://github.com)
```

[License](/pages/license/index.html)

[GitHub](https://github.com)

External links (which has `target="_blank"`) always has a jump icon.

## Images

You can display an image by adding `!` and wrapping the alt text in `[ ]`. Alt text is a short text equivalent of the information in the image. Then, wrap the link for the image in parentheses `( )`.

```markdown
![Cat Logo](cat.png)
```

![Cat Logo](cat.png)

## Lists

You can make an unordered list by preceding one or more lines of text with `-`, `*` or `+`.

```markdown
- JavaScript
- Python
- Rust
```

- JavaScript
- Python
- Rust

To order your list, precede each line with a number.

```markdown
1. JavaScript
2. Python
3. Rust
```

1. JavaScript
2. Python
3. Rust

## Nested lists

You can create a nested list by indenting one or more list items below another item.

```markdown
- Programming Languages
  - JavaScript
  - Python
  - Rust
- Operating Systems
  1. Windows
  2. Linux
  3. macOS
```

- Programming Languages
  - JavaScript
  - Python
  - Rust
- Operating Systems
  1. Windows
  2. Linux
  3. macOS

## Paragraphs

You can create a new paragraph by leaving a blank line between lines of text.

## Footnotes

You can add footnotes to your content by using this bracket syntax:

```text
Earth is the third planet from the Sun [^sun].

Jupiter is the fifth planet from the Sun and the largest in the Solar System. [^solar_system].

[^sun]: The [Sun](https://en.wikipedia.org/wiki/Sun) is the star at the center of the Solar System.

[^solar_system]: The Solar System is the gravitationally bound system of the Sun and the objects that orbit it.
```

Earth is the third planet from the Sun [^sun].

Jupiter is the fifth planet from the Sun and the largest in the Solar System. [^solar_system].

[^sun]: The [Sun](https://en.wikipedia.org/wiki/Sun) is the star at the center of the Solar System.

[^solar_system]: The Solar System is the gravitationally bound system of the Sun and the objects that orbit it.

The position of a footnote in your Markdown does not influence where the footnote will be rendered. You can write a footnote right after your reference to the footnote, and the footnote will still render at the bottom of the Markdown.
