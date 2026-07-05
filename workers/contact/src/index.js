const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const SOURCE = "here-be-dragons.ai";

const ALLOWED_ORIGINS = new Set([
  "https://here-be-dragons.ai",
  "https://www.here-be-dragons.ai",
  "https://here-be-dragons-ai.github.io",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin");

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return { Vary: "Origin" };
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(request, statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

async function handleContact(request, env, fetchImpl) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(request, 400, { error: "Invalid JSON body" });
  }

  const name = String(payload.name || "").trim().slice(0, MAX_NAME_LENGTH);
  const email = String(payload.email || "").trim().toLowerCase();

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return jsonResponse(request, 400, { error: "Invalid email" });
  }

  const airtableToken = env.AIRTABLE_TOKEN;
  const airtableBaseId = env.AIRTABLE_BASE_ID;
  const airtableTableName = env.AIRTABLE_TABLE_NAME || "Contacts";

  if (!airtableToken || !airtableBaseId) {
    return jsonResponse(request, 501, {
      error: "Airtable collector is not configured",
    });
  }

  const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`;

  try {
    const upstream = await fetchImpl(airtableUrl, {
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
              SubmittedAt: new Date().toISOString(),
            },
          },
        ],
        typecast: true,
      }),
    });

    if (!upstream.ok) {
      return jsonResponse(request, 502, {
        error: "Airtable rejected submission",
      });
    }

    const result = await upstream.json();

    return jsonResponse(request, 200, {
      ok: true,
      id: result.records?.[0]?.id,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(request, 502, { error: "Airtable request failed" });
  }
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== "POST") {
    const response = jsonResponse(request, 405, {
      error: "Method not allowed",
    });
    response.headers.set("Allow", "POST, OPTIONS");
    return response;
  }

  const url = new URL(request.url);

  if (url.pathname !== "/contact") {
    return jsonResponse(request, 404, { error: "Not found" });
  }

  return handleContact(request, env, fetchImpl);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
