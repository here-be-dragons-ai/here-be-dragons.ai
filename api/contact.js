const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function createSubmittedAt() {
  return new Date().toISOString();
}

async function contactHandler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const payload = request.body || {};
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();

  if (!EMAIL_PATTERN.test(email)) {
    return sendJson(response, 400, { error: "Invalid email" });
  }

  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const airtableTableName = process.env.AIRTABLE_TABLE_NAME || "Contacts";

  if (!airtableToken || !airtableBaseId) {
    return sendJson(response, 501, {
      error: "Airtable collector is not configured",
    });
  }

  const airtableUrl = new URL(
    `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(
      airtableTableName,
    )}`,
  );

  const upstream = await fetch(airtableUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${airtableToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Name: name,
            Email: email,
            Source: "here-be-dragons.ai",
            SubmittedAt: createSubmittedAt(),
          },
        },
      ],
      typecast: true,
    }),
  });

  if (!upstream.ok) {
    return sendJson(response, 502, {
      error: "Airtable rejected submission",
    });
  }

  const result = await upstream.json();

  return sendJson(response, 200, { ok: true, id: result.records?.[0]?.id });
}

module.exports = contactHandler;
module.exports.contactHandler = contactHandler;
