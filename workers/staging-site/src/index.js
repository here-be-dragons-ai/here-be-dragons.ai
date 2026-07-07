// Serves the static site (public/) behind HTTP Basic Auth for staging review.
// Any username is accepted; only the password is checked.

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

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Here be dragons staging"',
      "Cache-Control": "no-store",
    },
  });
}

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

export async function handleRequest(request, env) {
  if (!env.STAGING_PASSWORD) {
    // Fail closed: never serve the site unprotected.
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

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
