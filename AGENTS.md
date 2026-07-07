# AGENTS.md

Guidance for coding agents working in this repository.

## Project Shape

- Static site served by GitHub Pages: `public/` (`index.html`, `styles.css`,
  `main.js`, assets)
- Contact endpoint: Cloudflare Worker in `workers/contact/`
  (`src/index.js`, tests in `test/`, config in `cloudflare.config.ts`)
- Staging: Cloudflare Worker in `workers/staging-site/` serving `public/` as
  static assets behind Basic Auth at https://staging.here-be-dragons.ai;
  non-`main` pushes touching `public/**` or `workers/staging-site/**`
  auto-deploy it — review changes there before merging
- Deployment workflow: `.github/workflows/deploy.yml` (GitHub Pages)
- Visual asset: `public/docs/there-be-dragons-1-luma-cover.png` (hero image
  and social preview — keep the `/docs/...` URL stable)

## Working Rules

- Keep the site minimal and understated.
- No frontend framework, no build step — hand-written HTML/CSS/JS only.
- Keep copy in English unless explicitly requested otherwise.
- The contact form posts only to the `CONTACT_ENDPOINT` constant in
  `public/main.js` (`https://api.here-be-dragons.ai/contact`).
- Never commit secrets or local `.env` files.

## Validation

Run before committing:

```sh
npm run check
npm test
```

For visual changes, verify locally with:

```sh
npm run dev
```

## Deployment

Pushes to `main` deploy to GitHub Pages through GitHub Actions. The Worker
deploys automatically via Cloudflare Workers Builds when `workers/contact/**`
changes on `main` (command: `npx wrangler deploy --experimental-new-config`);
manual deploys use `cf deploy` from `workers/contact/` (use the `cf` CLI for
all Cloudflare operations — Workers, secrets, DNS).

## Form Integration

The Airtable integration depends on Worker secrets `AIRTABLE_TOKEN` and
`AIRTABLE_BASE_ID`, plus the `AIRTABLE_TABLE_NAME` var (default `Contacts`).
Expected Airtable fields are `Name`, `Email`, `Source`, and `SubmittedAt`.
