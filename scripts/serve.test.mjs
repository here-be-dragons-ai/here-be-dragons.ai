import assert from "node:assert/strict";
import test from "node:test";
import { createStaticServer } from "./serve.mjs";

async function withServer(fn) {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;

  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("serves index.html at / with the html content type", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
    assert.match(await res.text(), /Here be dragons/);
  });
});

test("serves assets with their content types", async () => {
  await withServer(async (base) => {
    const css = await fetch(`${base}/styles.css`);
    assert.equal(css.status, 200);
    assert.equal(css.headers.get("content-type"), "text/css; charset=utf-8");

    const img = await fetch(`${base}/docs/there-be-dragons-1-luma-cover.png`);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get("content-type"), "image/png");
  });
});

test("returns 404 for missing files", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/does-not-exist`);
    assert.equal(res.status, 404);
  });
});

test("does not serve files outside the public root", async () => {
  await withServer(async (base) => {
    for (const path of [
      "/../package.json",
      "/..%2fpackage.json",
      "/%2e%2e/package.json",
    ]) {
      const res = await fetch(`${base}${path}`);
      assert.notEqual(
        res.status,
        200,
        `expected non-200 for traversal path ${path}`,
      );
    }
  });
});
