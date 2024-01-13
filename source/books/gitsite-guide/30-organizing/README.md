# Organizing Your Contents

GitSite helps you organize your contents. There are 3 types of contents that GitSite supports. All files are put in `source` directory:

```ascii
source/
├── books/
├── blogs/
├── pages/
└── site.yml
```

## Books

A book contains a set of markdown documents organized with a tree structure:

```ascii
books/
└── guide/
    ├── book.yml    <-- book information
    ├── a/          <-- URL: /books/guide/a/index.html
    │   ├── m/      <-- URL: /books/guide/a/m/index.html
    │   ├── n/      <-- URL: /books/guide/a/n/index.html
    │   │   ├── p/  <-- URL: /books/guide/a/n/p/index.html
    │   │   └── q/  <-- URL: /books/guide/a/n/q/index.html
    │   └── l/
    ├── b/
    │   ├── x/
    │   ├── y/
    │   └── z/
    │       ├── v1/
    │       └── v2/
    └── c/
        ├── w1/
        └── w2/
```

Each directory must have a markdown file named `README.md`. GitSite scans the directory and generates book index as tree, sorted by directory name.

To specify the order, you can add sequence number in the directory name. For example:

```ascii
books/
└── guide/
    ├── 10-b/     <-- URL: /books/guide/b/index.html
    ├── 20-c/     <-- URL: /books/guide/c/index.html
    └── 30-a/     <-- URL: /books/guide/a/index.html
       ├── 10-n/  <-- URL: /books/guide/a/n/index.html
       └── 20-m/  <-- URL: /books/guide/a/m/index.html
```

This re-order the index with `b`, `c` and `a`. The sequence number is used for order and will be dropped in URL, so re-order a directory does not change the URL.

## Blogs

Blogs are simple markdown files organized with a list of directories, and each directory named starts with ISO date format `yyyy-MM-dd`:

```ascii
blogs/
├── 2024-01-01-hello/  <-- URL: /blogs/2024-01-01-hello/index.html
├── 2024-01-05/        <-- URL: /blogs/2024-01-05/index.html
└── 2024-02-10-style/  <-- URL: /blogs/2024-02-10-style/index.html
```

## Pages

Pages are used to display single pages. Each page has a simple directory name:

```ascii
pages/
├── about/    <-- URL: /pages/about/index.html
├── license/  <-- URL: /pages/license/index.html
└── privacy/  <-- URL: /pages/privacy/index.html
```

Pages are usually serves pages like `About Us`, `Term of Service`, etc.

## Index file

All markdown documents are named `README.md` for this can be viewed on GitHub directly, and build to `index.html`. The first line of `README.md` must be heading 1, which is treated as title, and the rest of lines are content:

```markdown
# This is title

This is content ...

More content ...
```
