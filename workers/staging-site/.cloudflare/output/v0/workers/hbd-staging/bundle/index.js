var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
function timingSafeEqual(a, b) {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i += 1) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Here be dragons staging"',
      "Cache-Control": "no-store"
    }
  });
}
__name(unauthorized, "unauthorized");
function passwordFromHeader(header) {
  if (!header || !header.startsWith("Basic ")) {
    return null;
  }
  let decoded;
  try {
    decoded = atob(header.slice("Basic ".length).trim());
  } catch {
    return null;
  }
  const separator = decoded.indexOf(":");
  return separator === -1 ? null : decoded.slice(separator + 1);
}
__name(passwordFromHeader, "passwordFromHeader");
async function handleRequest(request, env) {
  if (!env.STAGING_PASSWORD) {
    return new Response("Staging password is not configured", { status: 503 });
  }
  const password = passwordFromHeader(request.headers.get("Authorization"));
  if (password === null || !timingSafeEqual(password, env.STAGING_PASSWORD)) {
    return unauthorized();
  }
  const response = await env.ASSETS.fetch(request);
  const withHeaders = new Response(response.body, response);
  withHeaders.headers.set("X-Robots-Tag", "noindex, nofollow");
  return withHeaders;
}
__name(handleRequest, "handleRequest");
var index_default = {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
export {
  index_default as default,
  handleRequest
};
//# sourceMappingURL=index.js.map
