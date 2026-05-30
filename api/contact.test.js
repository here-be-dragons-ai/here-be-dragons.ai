const assert = require("node:assert/strict");
const test = require("node:test");
const { contactHandler } = require("./contact.js");

function createResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

async function callHandler({ method = "POST", body = {} } = {}) {
  const response = createResponse();
  await contactHandler({ method, body }, response);
  return response;
}

test("rejects non-POST requests", async () => {
  const response = await callHandler({ method: "GET" });

  assert.equal(response.statusCode, 405);
  assert.deepEqual(response.payload, { error: "Method not allowed" });
});

test("validates email before checking Airtable configuration", async () => {
  const response = await callHandler({ body: { email: "not-an-email" } });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.payload, { error: "Invalid email" });
});

test("returns unconfigured when Airtable credentials are missing", async () => {
  delete process.env.AIRTABLE_TOKEN;
  delete process.env.AIRTABLE_BASE_ID;

  const response = await callHandler({ body: { email: "hello@example.com" } });

  assert.equal(response.statusCode, 501);
  assert.deepEqual(response.payload, {
    error: "Airtable collector is not configured",
  });
});

test("creates an Airtable record", async () => {
  const previousFetch = global.fetch;
  const previousToken = process.env.AIRTABLE_TOKEN;
  const previousBaseId = process.env.AIRTABLE_BASE_ID;
  const previousTableName = process.env.AIRTABLE_TABLE_NAME;
  const calls = [];

  process.env.AIRTABLE_TOKEN = "pat_test";
  process.env.AIRTABLE_BASE_ID = "app_test";
  process.env.AIRTABLE_TABLE_NAME = "Contacts";

  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      async json() {
        return { records: [{ id: "rec_test" }] };
      },
    };
  };

  try {
    const response = await callHandler({
      body: { name: "Ada", email: "ada@example.com" },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { ok: true, id: "rec_test" });
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
  } finally {
    global.fetch = previousFetch;

    if (previousToken === undefined) delete process.env.AIRTABLE_TOKEN;
    else process.env.AIRTABLE_TOKEN = previousToken;

    if (previousBaseId === undefined) delete process.env.AIRTABLE_BASE_ID;
    else process.env.AIRTABLE_BASE_ID = previousBaseId;

    if (previousTableName === undefined) delete process.env.AIRTABLE_TABLE_NAME;
    else process.env.AIRTABLE_TABLE_NAME = previousTableName;
  }
});
