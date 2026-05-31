const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const SOURCE = "here-be-dragons.ai";

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function createSubmittedAt() {
  return new Date().toISOString();
}

async function contactHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader?.("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const payload = request.body || {};
  const name = String(payload.name || "").trim().slice(0, MAX_NAME_LENGTH);
  const email = String(payload.email || "").trim().toLowerCase();

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
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

  try {
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
              Source: SOURCE,
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
  } catch (error) {
    console.error(error);
    return sendJson(response, 502, {
      error: "Airtable request failed",
    });
  }
}

module.exports = contactHandler;
module.exports.contactHandler = contactHandler;
