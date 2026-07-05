import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/index.js";

const ORIGIN = "https://here-be-dragons.ai";

const CONFIGURED_ENV = {
  AIRTABLE_TOKEN: "pat_test",
  AIRTABLE_BASE_ID: "app_test",
  AIRTABLE_TABLE_NAME: "Contacts",
};

function contactRequest({ method = "POST", body, origin = ORIGIN } = {}) {
  return new Request("https://api.here-be-dragons.ai/contact", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function airtableOk() {
  return new Response(JSON.stringify({ records: [{ id: "rec_test" }] }), {
    status: 200,
  });
}

test("answers preflight with CORS headers for allowed origins", async () => {
  const response = await handleRequest(
    contactRequest({ method: "OPTIONS" }),
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.equal(
    response.headers.get("Access-Control-Allow-Methods"),
    "POST, OPTIONS",
  );
});

test("does not echo CORS headers for unknown origins", async () => {
  const response = await handleRequest(
    contactRequest({ method: "OPTIONS", origin: "https://evil.example" }),
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("rejects non-POST requests", async () => {
  const response = await handleRequest(contactRequest({ method: "GET" }), {});

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST, OPTIONS");
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("rejects unknown paths", async () => {
  const request = new Request("https://api.here-be-dragons.ai/other", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const response = await handleRequest(request, {});

  assert.equal(response.status, 404);
});

test("validates email before checking Airtable configuration", async () => {
  const response = await handleRequest(
    contactRequest({ body: { email: "not-an-email" } }),
    {},
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid email" });
});

test("returns unconfigured when Airtable credentials are missing", async () => {
  const response = await handleRequest(
    contactRequest({ body: { email: "hello@example.com" } }),
    {},
  );

  assert.equal(response.status, 501);
  assert.deepEqual(await response.json(), {
    error: "Airtable collector is not configured",
  });
});

test("creates an Airtable record", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return airtableOk();
  };

  const response = await handleRequest(
    contactRequest({ body: { name: " Ada ", email: "ADA@EXAMPLE.COM " } }),
    CONFIGURED_ENV,
    fetchImpl,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.deepEqual(await response.json(), { ok: true, id: "rec_test" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.airtable.com/v0/app_test/Contacts");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.authorization, "Bearer pat_test");

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.records[0].fields.Name, "Ada");
  assert.equal(body.records[0].fields.Email, "ada@example.com");
  assert.equal(body.records[0].fields.Source, "here-be-dragons.ai");
  assert.match(body.records[0].fields.SubmittedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(body.typecast, true);
});

test("truncates long names before sending to Airtable", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return airtableOk();
  };

  const response = await handleRequest(
    contactRequest({
      body: { name: "A".repeat(140), email: "hello@example.com" },
    }),
    CONFIGURED_ENV,
    fetchImpl,
  );

  assert.equal(response.status, 200);

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.records[0].fields.Name.length, 120);
});

test("returns bad gateway when Airtable rejects submission", async () => {
  const fetchImpl = async () => new Response("{}", { status: 422 });

  const response = await handleRequest(
    contactRequest({ body: { email: "hello@example.com" } }),
    CONFIGURED_ENV,
    fetchImpl,
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Airtable rejected submission",
  });
});

test("returns bad gateway when Airtable request fails", async (t) => {
  t.mock.method(console, "error", () => {});

  const fetchImpl = async () => {
    throw new Error("network down");
  };

  const response = await handleRequest(
    contactRequest({ body: { email: "hello@example.com" } }),
    CONFIGURED_ENV,
    fetchImpl,
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "Airtable request failed" });
});
