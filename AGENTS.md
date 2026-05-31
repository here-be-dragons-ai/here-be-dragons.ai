# AGENTS.md

Guidance for coding agents working in this repository.

## Project Shape

- Static landing page: `index.html`, `styles.css`, `main.js`
- Vercel serverless endpoint: `api/contact.js`
- API tests: `api/contact.test.js`
- Deployment workflow: `.github/workflows/deploy.yml`
- Visual asset: `docs/there-be-dragons-1-luma-cover.png`

## Working Rules

- Keep the site minimal and understated.
- Do not introduce a frontend framework unless explicitly requested.
- Keep copy in English unless explicitly requested otherwise.
- Do not make real external requests from the frontend.
- The contact form should continue to post only to `/api/contact`.
- Never commit secrets or local `.env` files.

## Validation

Run before committing:

```sh
npm run check
npm test
```

For visual changes, verify locally with:

```sh
vercel dev --listen 4173 --yes
```

## Deployment

Pushes to `main` deploy production through GitHub Actions and Vercel. Pushes to
`staging` deploy preview. Watch the workflow after pushing when making changes
intended for production.

## Form Integration

The Airtable integration depends on:

- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME`, defaulting to `Contacts`

Expected Airtable fields are `Name`, `Email`, `Source`, and `SubmittedAt`.
