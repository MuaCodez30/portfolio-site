# Muaataz Ismaeel — Portfolio

Personal site built with [Astro](https://astro.build), deployed to GitHub Pages:
https://muaataz.com/

## Edit content

All text lives in [`resume.yaml`](resume.yaml). Keep it in sync with the CV at `public/resume.pdf`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321/
npm run build    # static output in dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.
