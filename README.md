# Here be dragons

Landing page for `here-be-dragons.ai`.

## What It Is

A dependency-free static site served by GitHub Pages, plus a small Cloudflare
Worker that receives contact-form submissions and stores them in Airtable.

- `public/` — everything GitHub Pages serves (HTML, CSS, JS, assets)
- `workers/contact/` — Cloudflare Worker for the contact form

## Local Development

```sh
npm run dev
```

Open `http://localhost:4173`. The contact form works locally too —
`http://localhost:4173` is on the Worker's CORS allowlist (submissions go to
the production Worker, so use test data).

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
CORS allowlist (`here-be-dragons.ai`, `www.`, `here-be-dragons-ai.github.io`,
`localhost:4173` for local dev),
and writes to Airtable using these Worker secrets/vars:

```sh
AIRTABLE_TOKEN=       # secret: cf workers secrets update AIRTABLE_TOKEN --script-name hbd-contact --text ...
AIRTABLE_BASE_ID=     # secret: cf workers secrets update AIRTABLE_BASE_ID --script-name hbd-contact --text ...
AIRTABLE_TABLE_NAME=Contacts   # text binding, set in cloudflare.config.ts
```

Expected Airtable fields:

- `Name`
- `Email`
- `Source`
- `SubmittedAt`

If Airtable credentials are missing, the Worker returns `501` without making
any external request.

### Worker deployment

Deploys run automatically through [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
(Cloudflare's GitHub integration): pushes to `main` touching
`workers/contact/**` run `npx wrangler deploy --experimental-new-config` from
`workers/contact/`; other branches upload a preview version. The
`--experimental-new-config` flag is required because the Worker is configured
via `cloudflare.config.ts` (new config format).

Manual deploys still work with the Cloudflare CLI:

```sh
cd workers/contact
cf deploy
```

The Worker is served on the custom domain `api.here-be-dragons.ai` (attached
by Cloudflare, no DNS record needed) plus `hbd-contact.btlg.workers.dev`.

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
