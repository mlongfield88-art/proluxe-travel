/**
 * Catch-all middleware for /insights/* routes.
 *
 * Intercepts any request under /insights/, requires HTTP Basic Auth, then
 * passes through to the static HTML asset on success. Returns 401 with a
 * WWW-Authenticate challenge on failure so the browser shows its native
 * password prompt.
 *
 * Required Pages env vars:
 *   INSIGHTS_USER       Default "casamarenya" if unset.
 *   INSIGHTS_PASSWORD   Required. No default. Function returns 500 if missing.
 *
 * Realm name "Casa Marenya Insights" is reused by the API endpoint so the
 * browser sends the same credentials automatically once you have logged in.
 */

const REALM = "Casa Marenya Insights";

export async function onRequest(context) {
  const { request, env } = context;

  const auth = checkBasicAuth(request, env);
  if (auth.error) return auth.response;

  // Auth OK, fetch the static asset Pages would have served.
  return env.ASSETS.fetch(request);
}

function checkBasicAuth(request, env) {
  const expectedUser = env.INSIGHTS_USER || "casamarenya";
  const expectedPass = env.INSIGHTS_PASSWORD;

  if (!expectedPass) {
    return {
      error: true,
      response: new Response(
        "INSIGHTS_PASSWORD not set as a Pages env var.",
        { status: 500 }
      )
    };
  }

  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Basic ")) {
    return { error: true, response: challenge() };
  }

  let decoded;
  try {
    decoded = atob(header.slice(6).trim());
  } catch (e) {
    return { error: true, response: challenge() };
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return { error: true, response: challenge() };

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (!constantTimeEquals(user, expectedUser) || !constantTimeEquals(pass, expectedPass)) {
    return { error: true, response: challenge() };
  }

  return { error: false };
}

function challenge() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "content-type": "text/plain; charset=utf-8"
    }
  });
}

function constantTimeEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}
