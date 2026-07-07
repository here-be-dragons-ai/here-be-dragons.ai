import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/index.js";

const PASSWORD = "open-sesame";

function envWithAssets() {
  const calls = [];
  return {
    calls,
    STAGING_PASSWORD: PASSWORD,
    ASSETS: {
      fetch(request) {
        calls.push(request.url);
        return new Response("<html>site</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      },
    },
  };
}

function stagingRequest(authorization) {
  return new Request("https://staging.here-be-dragons.ai/", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

function basic(user, password) {
  return "Basic " + btoa(`${user}:${password}`);
}

test("fails closed when no password is configured", async () => {
  const response = await handleRequest(stagingRequest(), {});
  assert.equal(response.status, 503);
});

test("challenges requests without credentials", async () => {
  const response = await handleRequest(stagingRequest(), envWithAssets());

  assert.equal(response.status, 401);
  assert.match(response.headers.get("WWW-Authenticate"), /^Basic /);
});

test("rejects a wrong password", async () => {
  const response = await handleRequest(
    stagingRequest(basic("reviewer", "wrong")),
    envWithAssets(),
  );

  assert.equal(response.status, 401);
});

test("rejects malformed authorization headers", async () => {
  for (const header of ["Bearer abc", "Basic !!!not-base64!!!", "Basic "]) {
    const response = await handleRequest(
      stagingRequest(header),
      envWithAssets(),
    );
    assert.equal(response.status, 401, `expected 401 for header "${header}"`);
  }
});

test("serves assets for the right password, any username", async () => {
  const env = envWithAssets();

  for (const user of ["reviewer", "", "dragon"]) {
    const response = await handleRequest(
      stagingRequest(basic(user, PASSWORD)),
      env,
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "<html>site</html>");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }

  assert.equal(env.calls.length, 3);
});

test("passwords containing colons work", async () => {
  const env = envWithAssets();
  env.STAGING_PASSWORD = "with:colon";

  const response = await handleRequest(
    stagingRequest(basic("user", "with:colon")),
    env,
  );

  assert.equal(response.status, 200);
});
