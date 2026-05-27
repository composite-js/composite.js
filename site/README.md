# composite.js Site

This directory contains the static website scaffold for `composite.js`.

## Preview

Install dependencies from the repository root:

```bash
pnpm install
```

Start the local development server:

```bash
pnpm run site:dev
```

The site is available at:

```text
http://localhost:4321/
```

## Build

Sync example snippets and datasets used by live browser previews:

```bash
pnpm run site:export-examples
```

Build the static site:

```bash
pnpm run site:build
```

Preview the production build locally:

```bash
pnpm run site:preview
```

## Deploy

Use these settings for static hosting providers:

```text
Build command: pnpm run site:build
Publish directory: site/dist
```

For GitHub Pages under a repository path, set the base path during build:

```bash
SITE_BASE_PATH=/composite.js/ pnpm run site:build
```

For a custom domain or root deployment, leave `SITE_BASE_PATH` unset.
