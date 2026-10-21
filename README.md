# KITO AI

KITO AI is a React voice assistant interface built with Vite.

## Development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## GitHub Pages deployment

The included GitHub Actions workflow deploys the site automatically whenever
changes are pushed to `main`.

1. Push this project to a GitHub repository.
2. In **Settings > Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).

The Vite base path is selected automatically from `GITHUB_REPOSITORY`, so both
project pages (`https://<user>.github.io/<repository>/`) and user pages
(`https://<user>.github.io/`) work correctly.

If a different base path is needed for a local build, set `VITE_BASE_PATH`
before running the build:

```bash
VITE_BASE_PATH=/my-site/ npm run build
```
