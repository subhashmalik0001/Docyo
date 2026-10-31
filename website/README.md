# Docyo Marketing Website

Production Next.js (App Router) + TypeScript + Tailwind CSS marketing site for **Docyo** (`Drag. Hold Shift. Convert.`).

## Stack

- **Framework:** Next.js (App Router, static `output: "export"` ready for any host)
- **Language:** TypeScript (`strict: true`)
- **Styling:** Tailwind CSS v4 + custom CSS spotlight & noise surfaces
- **Typography:** Self-hosted `Clash Display` (headlines), `Satoshi` (UI & body), and `Geist Mono` (extensions & technical specs) via `next/font`
- **Motion:** Motion (`motion/react`) + Lenis smooth scroll (`prefers-reduced-motion` aware)

## Local Development

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build & Static Export

```bash
cd website
npm run typecheck
npm run build
```

`npm run build` outputs a fully self-contained static bundle inside `website/out/`.

### Hosting Options

- **Vercel / Netlify / Cloudflare Pages:** Set the Root Directory to `website`, Build Command to `npm run build`, and Output Directory to `out` (Vercel also supports Next.js out of the box).
- **GitHub Pages (under `/Docyo` subpath):**
  ```bash
  NEXT_PUBLIC_BASE_PATH=/Docyo npm run build
  ```
  Deploy `website/out/` (include an empty `out/.nojekyll` file so `_next/` assets are served cleanly).

## Single-File Configuration

All release versions, asset filenames, file sizes, download URLs, and site metadata live in:

- `src/config/site.ts` (`SITE_CONFIG` and `DOWNLOAD_CONFIG`)

