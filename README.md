# Here be dragons

Minimal landing page for `here-be-dragons.ai`.

## What It Is

This is a static Vercel site with a small serverless contact endpoint. The page
collects name and email submissions and stores them in Airtable when the
required environment variables are configured.

## Local Development

```sh
npm ci
vercel dev --listen 4173 --yes
```

Open `http://localhost:4173`.

## Checks

```sh
npm run check
npm test
```

`npm run check` validates JavaScript syntax. `npm test` runs the Node tests for
the contact API.

## Contact Form

The frontend posts JSON to `/api/contact`:

```json
{
  "name": "Optional name",
  "email": "person@example.com",
  "source": "here-be-dragons.ai"
}
```

The Vercel function writes to Airtable using these environment variables:

```sh
AIRTABLE_TOKEN=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=Contacts
```

Expected Airtable fields:

- `Name`
- `Email`
- `Source`
- `SubmittedAt`

If Airtable credentials are missing, the API returns `501` and the frontend
shows a configuration message instead of making any external request.

## Deployment

Deployments run through GitHub Actions:

- Push to `main` deploys production.
- Push to `staging` deploys a Vercel preview.
- `workflow_dispatch` can deploy either target manually.

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`

Optional GitHub variable:

- `AIRTABLE_TABLE_NAME`

## Social And Crawlers

The site includes:

- `favicon.svg`
- `robots.txt`
- `sitemap.xml`
- canonical URL
- Open Graph tags
- Twitter Card tags

The social preview image currently uses `docs/there-be-dragons-1-luma-cover.png`.
