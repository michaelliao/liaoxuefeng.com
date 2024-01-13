# GitSite Introduction

GitSite is a document platform based on modern Web technology, any individual and team can organize and write documents through Git, and automatically generate HTML5-compliant web sites.

Git is currently the most popular version control system, and hosting platforms such as GitHub provide powerful and reliable hosting of Git repositories. Many individuals and teams manage Markdown documents through Git on platforms like GitHub. GitSite does not require the use of specialized front-end build tools, nor does it require cumbersome configuration to quickly generate a web site based on Markdown documents from Git repositories, and all contents on the site is static HTML pages.

## Design Goals

GitSite is designed to support Git repositories with no more than 10,000 Markdown documents, usually product documentation, knowledge bases, personal blogs, or a book. If the number of documents is very large, you may want to consider using database management, as GitSite's static page-based approach can slow down front-end searches significantly.
