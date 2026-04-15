# Portfolio site (Astro)

Static, Vercel-ready portfolio. **Content** lives in [`resume.yaml`](resume.yaml) in this folder (so Vercel uploads it with the app).

`resume.yaml` is portfolio-first: `hero.intro`, structured `skill_groups` and `languages`, `projects[].kind` (`featured` | `course` | `side` | `archive`) with optional `context`, `lede`, `stack`, and `links`. Legacy `technical_skills_line`, string `languages`, string-list `activities`, and `archive_projects` are still merged at build time if you use them.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

- Dev server: [http://localhost:4321](http://localhost:4321) (default Astro port).
- Production output: `dist/`.

## Vercel

1. Create a new project and point it at this Git repository (or upload the folder).
2. Set **Root Directory** to `portfolio/site`.
3. Framework preset: **Astro** (or “Other” with build `npm run build`, output `dist`).
4. After your first deploy, update `astro.config.mjs` → `site` to your real URL (for canonical links if you add them later).

## Assets

- **Avatar:** replace [`public/avatar-placeholder.svg`](public/avatar-placeholder.svg) with your photo (e.g. `public/profile.jpg`) and update [`src/components/Hero.astro`](src/components/Hero.astro) to use it.
- **Resume PDF:** [`public/resume.pdf`](public/resume.pdf) — copy your latest export here (or re-copy from the workspace root `Muaataz Ismaeel 2026 Resume - ML.pdf`).

## Note on folder names with `*`

If this repo lives under a path that contains a literal asterisk, **Astro 5** and **`extends`: `astro/tsconfigs/strict`** can break Node/Vite resolution. This project pins **Astro 4** and uses an **inlined `tsconfig.json`** to stay compatible. If you rename the parent folder to remove `*`, you can try upgrading Astro again.
