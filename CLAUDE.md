# google-review-link-generator — Project Memory for Claude

**Public, open-source (MIT)** tool. Anyone can read this repo, so treat every commit as published.

- Serpnetic's planning notes live in a private repo; ask the owner before changing scope.
- The live version at https://tools.serpnetic.cloud/google-review-link-generator/ includes this repo
  as a git submodule inside a private site repo.

## What it does

Place ID / Google link → direct review link (`search.google.com/local/writereview?placeid=…` or
`g.page/r/<code>/review`), QR code (PNG/SVG), printable white-label review card (print → PDF).
Browser-only: no API key, no server, nothing stored.

## Layout

- `src/review-link.js` — pure parsing/link logic (no DOM). Tested in `test/`.
- `src/tool.js` — `mountReviewLinkTool(el, options)` builds the UI.
- `src/style.css` — neutral styles; host sites re-theme via `--rlg-*` variables.
- `index.html` — standalone demo (`npm run dev`).

## Rules (public repo)

- No Serpnetic branding inside the tool UI or the printable card (agencies use it white-label).
  A credit link in README is fine.
- No client names, real business data, secrets, hostnames or IPs. Examples use Google's public
  documentation Place ID or "Acme Plumbing".
- User text is written with `textContent`/`value`, never `innerHTML`.
- `npm test` must pass; CI runs gitleaks + tests + build.
- Serpnetic SEO copy, FAQ and page layout live in the private site repo, not here.
