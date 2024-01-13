# Install and Deploy

## Install GitSite command line tool

Use `npm` to install GitSite command line tool:

```bash
$ npm install -g gitsite-cli
```

## Setup a new site

First create an empty directory which will be used as your site's root directory and also a git repo. Let's name it as `awesome`:

```bash
$ mkdir awesome
```

Run `gitsite-cli init` under the `awesome` directory:

```bash
$ cd awesome
$ gitsite-cli init
```

The GitSite command line tool does the following job to initialize your new site:

1. Check if current directory is an empty directory;
2. Download sample site from GitHub;
3. Unzip the sample site.

Now you can find the following files and directories under your `awesome` directory:

```ascii
awesome/
├── themes/       <-- all themes
│   └── default/  <-- a theme named 'default'
│
└── source/       <-- contains all markdown docs
    │
    ├── books/            <-- all books
    │   ├── user-guide/   <-- a book
    │   │   ├── book.yml  <-- book name, author and description
    │   │   ├── 10-introduction/  <-- chapter order and short name
    │   │   │   ├── README.md     <-- chapter content
    │   │   │   └── test.png      <-- static resources used in the chapter
    │   │   ├── 20-installation/  <-- chapter
    │   │   │   ├── README.md
    │   │   │   ├── 10-create-repo/  <-- sub chapter
    │   │   │   │   └── README.md
    │   │   │   ├── 20-workflow/     <-- sub chapter
    │   │   │   │   └── README.md
    │   │   │   └── 30-deploy/       <-- sub chapter
    │   │   │       └── README.md
    │   │   └── ...  <-- more chapters
    │   └── ...  <-- more books
    │
    ├── blogs/                 <-- all blogs
    │   ├── 2024-01-01-hello/  <-- blog date and short name
    │   │   ├── README.md      <-- blog content
    │   │   └── hello.jpg      <-- static resources used in the blog
    │   └── ...                <-- more blogs
    │
    ├── pages/             <-- all pages
    │   ├── license/       <-- about page
    │   │   └── README.md  <-- page content
    │   └── ...            <-- more pages
    │
    ├── 404.md       <-- display as 404 page if not found
    ├── README.md    <-- display as home page
    ├── favicon.ico  <-- favorite icon
    ├── site.yml     <-- site config
    └── static/      <-- static resources
        ├── custom.css
        ├── logo.png
        └── ...
```

## Preview site on local

Run `gitesite-cli serve` to start a local HTTP server to serve the site:

```bash
$ gitsite-cli serve
```

Then you can visit your site on [http://localhost:3000](http://localhost:3000):

![Home page](home.png)

## Update site settings

The site settings are stored in `source/site.yml`. You should update the settings:

- Set your site's name, description, etc;
- Set your site's navigation menus;
- Set your Disqus, Google analytics ID, or just remove it.

## Deploy to GitHub page

To deploy site to GitHub page, first create a repo on GitHub and push your local files to the remote.

To enable GitHub page, go to repo - Settings - Pages - Build and deployment: select `GitHub Actions`.

Make a new push to trigger the Action for deployment.

The workflow script file is `.github/workflows/gitsite.yml`. Check the sample [gitsite.yml](https://github.com/michaelliao/gitsite/blob/main/.github/workflows/gitsite.yml).

## Deploy to GitLab page

It is similar to deploy site to GitLab, and GitLab requires a `.gitlab-ci.yml` script. Check the sample [.gitlab-ci.yml](https://gitlab.com/cryptomichael/gitsite/-/blob/main/.gitlab-ci.yml?ref_type=heads).

## Deploy to CloudFlare page

To deploy site to CloudFlare page, create application from GitHub repo, then open application settings - `Builds & deployments` - `Build configurations` - `Edit configurations`:

- Framework preset: None
- Build command: `npm install gitsite-cli -g && gitsite-cli build -o _site -v`
- Build output directory: `/_site`
- Root directory: leave empty.

## Deploy to Vercel

To deploy site to Vercel, create a new project by import GitHub repo, then configure project:

- Framework Preset: Other
- Root Direction: `./`

Build and Output Settings:

- Build Command: `npm install -g gitsite-cli && gitsite-cli build -o dist -v`
- Output Directory: `dist`
- Install Command: leave empty.

## Deploy to Self-hosted Nginx

GitSite generates pure HTML files by command `gitsite-cli build`. You can specify the output directory (default to `dist`) by `--output` or `-o`:

```bash
$ gitsite-cli build -o dist -v
```

Copy all files in `dist` to Nginx `www` directory, edit the server configuration:

```
server {
    listen       80;
    server_name  change.to.your.server.name;
    root         /path/to/gitsite/dist;
    index        index.html;
    error_page   404 /404.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```
