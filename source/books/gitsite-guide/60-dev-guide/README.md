# Developer's Guide

GitSite uses [Nunjucks](https://mozilla.github.io/nunjucks/) as the template engine, rendering Markdown documents in real time for local preview, and converting markdown documents to HTML files in build mode.

All themes are stored in the `themes` directory. You can install multiple themes, and the `default` theme is used by default. To specify a particular theme, you can configure it in `site.yml`:

```yaml
site:
  theme: default
```

Template files are required under a specific theme:

```ascii
default
├── blog.html         <-- for blog full page
├── blog_content.html <-- for blog content page
├── book.html         <-- for book chapter page
├── book_content.html <-- for book chapter content page
├── page.html         <-- for any single document page
├── post-build.mjs    <-- (optional) auto executed after build
├── pre-build.mjs     <-- (optional) auto executed before build
└── static            <-- (optional) store static files
```

Nunjucks template engine enables the inheritance and referencing of other templates within a single template. This feature proves advantageous for reusing components, allowing for the extraction of common parts such as header and footer.

## Create a new theme

To create a new theme, the best way is copying the `default` theme and rename it, then update the theme setting in `site.yml`. This allows you change the theme progressively.

Themes are version controlled with source in the same repo.
