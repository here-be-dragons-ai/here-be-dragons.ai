# Here be dragons

Landing page for `here-be-dragons.ai`.

## What It Is

A dependency-free static site served by GitHub Pages, plus a small Cloudflare
Worker that receives contact-form submissions and stores them in Airtable.

- `public/` — everything GitHub Pages serves (HTML, CSS, JS, assets)
- `workers/contact/` — Cloudflare Worker for the contact form

## Local Development

```sh
python3 -m http.server 4173 --directory public
```

Open `http://localhost:4173`.

## Checks

```sh
npm run check
npm test
```

`npm run check` validates JavaScript syntax. `npm test` runs the Node tests for
the contact Worker.

## Contact Form

The frontend posts JSON to `https://api.here-be-dragons.ai/contact`:

```json
{
  "name": "Optional name",
  "email": "person@example.com"
}
```

The Cloudflare Worker (`workers/contact/`) validates the submission, applies a
CORS allowlist (`here-be-dragons.ai`, `www.`, `here-be-dragons-ai.github.io`),
and writes to Airtable using these Worker secrets/vars:

```sh
AIRTABLE_TOKEN=       # secret: npx wrangler secret put AIRTABLE_TOKEN
AIRTABLE_BASE_ID=     # secret: npx wrangler secret put AIRTABLE_BASE_ID
AIRTABLE_TABLE_NAME=Contacts   # var, set in wrangler.toml
```

Expected Airtable fields:

- `Name`
- `Email`
- `Source`
- `SubmittedAt`

If Airtable credentials are missing, the Worker returns `501` without making
any external request.

### Worker deployment

```sh
cd workers/contact
npx wrangler deploy
```

The Worker is routed to the custom domain `api.here-be-dragons.ai` (configured
in `wrangler.toml`; Cloudflare manages the DNS record automatically).

## Site Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`
(test job, then `actions/deploy-pages`). The custom domain
`here-be-dragons.ai` is configured in the repository's Pages settings; DNS for
apex and `www` lives on Cloudflare and points at GitHub Pages.

## Social And Crawlers

The site includes:

- `favicon.svg`
- `robots.txt`
- `sitemap.xml`
- canonical URL
- Open Graph tags
- Twitter Card tags

The social preview image is `public/docs/there-be-dragons-1-luma-cover.png`
(served as `/docs/there-be-dragons-1-luma-cover.png`); the same image is the
hero background.
