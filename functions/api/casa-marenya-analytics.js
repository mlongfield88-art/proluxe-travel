/**
 * Casa Marenya analytics endpoint.
 *
 * Calls Cloudflare's Web Analytics GraphQL API server-side using the
 * CLOUDFLARE_ANALYTICS_TOKEN secret, then returns a normalised JSON
 * payload to the /insights/casa-marenya page.
 *
 * Required Pages env vars (set in Cloudflare dashboard, Production):
 *   CLOUDFLARE_ANALYTICS_TOKEN  Token with permission Account → Analytics → Read
 *   CLOUDFLARE_ACCOUNT_TAG      The Cloudflare account ID (32 hex chars)
 *
 * Optional query params:
 *   ?days=7|30|90              Window length (default 7)
 *   ?path=/casa-marenya.html   Path prefix to filter on (default casa-marenya)
 */

// Use the WORKING site tag that's actually registered against proluxetravels.com
// in this Cloudflare account. The previous tag (3ce857dbd57e40b3bd26e184735e6c54)
// had zero data ever recorded against it. Verified 2026-05-05 by querying
// the Cloudflare GraphQL Analytics API: tag 9000d55e23e340938946225c8431dd4e
// has 350+ events recorded across the proluxetravels.com path tree.
const SITE_TAG = "9000d55e23e340938946225c8431dd4e";
const DEFAULT_PATH_VARIANTS = [
  "/casa-marenya",
  "/casa-marenya.html",
  "/casa-marenya/"
];
const REALM = "Casa Marenya Insights";

export async function onRequest(context) {
  const { env, request } = context;

  // Same Basic Auth realm as /insights/* so the browser auto-sends the
  // credentials it already collected when the user opened the page.
  const auth = checkBasicAuth(request, env);
  if (auth.error) return auth.response;

  const url = new URL(request.url);

  const days = clampDays(parseInt(url.searchParams.get("days") || "7", 10));
  const pathParam = url.searchParams.get("path");
  const pathVariants = pathParam ? [pathParam] : DEFAULT_PATH_VARIANTS;

  const TOKEN = env.CLOUDFLARE_ANALYTICS_TOKEN;
  const ACCOUNT_TAG = env.CLOUDFLARE_ACCOUNT_TAG;

  if (!TOKEN || !ACCOUNT_TAG) {
    return json({
      error: "missing_env",
      message:
        "Set CLOUDFLARE_ANALYTICS_TOKEN and CLOUDFLARE_ACCOUNT_TAG as Pages env vars (Production)."
    }, 500);
  }

  const now = new Date();
  const past = new Date(now.getTime() - days * 86400000);
  const dateFrom = past.toISOString().split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  const query = `
    query CasaMarenyaAnalytics(
      $accountTag: String!,
      $siteTag: String!,
      $dateFrom: String!,
      $dateTo: String!,
      $paths: [String!]
    ) {
      viewer {
        accounts(filter: {accountTag: $accountTag}) {

          totals: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 10
          ) {
            count
            sum { visits }
          }

          byDay: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 200
            orderBy: [date_ASC]
          ) {
            count
            sum { visits }
            dimensions { date }
          }

          byPath: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 25
            orderBy: [count_DESC]
          ) {
            count
            sum { visits }
            dimensions { requestPath }
          }

          byCountry: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 15
            orderBy: [count_DESC]
          ) {
            count
            dimensions { countryName }
          }

          byReferer: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths,
              refererHost_neq: ""
            }
            limit: 15
            orderBy: [count_DESC]
          ) {
            count
            dimensions { refererHost }
          }

          byDevice: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            dimensions { deviceType }
          }

          byBrowser: rumPageloadEventsAdaptiveGroups(
            filter: {
              siteTag: $siteTag,
              date_geq: $dateFrom,
              date_leq: $dateTo,
              requestPath_in: $paths
            }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            dimensions { userAgentBrowser }
          }

        }
      }
    }
  `;

  let res;
  try {
    res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag: ACCOUNT_TAG,
          siteTag: SITE_TAG,
          dateFrom,
          dateTo,
          paths: pathVariants
        }
      })
    });
  } catch (err) {
    return json({ error: "network", message: String(err) }, 502);
  }

  if (!res.ok) {
    return json({
      error: "upstream_status",
      status: res.status,
      message: await res.text()
    }, 502);
  }

  const data = await res.json();

  if (data.errors) {
    return json({ error: "graphql", detail: data.errors }, 502);
  }

  const account = (data.data && data.data.viewer && data.data.viewer.accounts && data.data.viewer.accounts[0]) || {};

  const sumCount = (rows) => (rows || []).reduce((s, r) => s + (r.count || 0), 0);
  const sumVisits = (rows) => (rows || []).reduce((s, r) => s + ((r.sum && r.sum.visits) || 0), 0);

  return json({
    range: { dateFrom, dateTo, days },
    pathFilter: pathVariants,
    totals: {
      pageviews: sumCount(account.totals),
      visits: sumVisits(account.totals)
    },
    byDay: (account.byDay || []).map((r) => ({
      date: r.dimensions && r.dimensions.date,
      count: r.count,
      visits: (r.sum && r.sum.visits) || 0
    })),
    byPath: (account.byPath || []).map((r) => ({
      path: r.dimensions && r.dimensions.requestPath,
      count: r.count,
      visits: (r.sum && r.sum.visits) || 0
    })),
    byCountry: (account.byCountry || []).map((r) => ({
      country: r.dimensions && r.dimensions.countryName,
      count: r.count
    })),
    byReferer: (account.byReferer || []).map((r) => ({
      host: r.dimensions && r.dimensions.refererHost,
      count: r.count
    })),
    byDevice: (account.byDevice || []).map((r) => ({
      device: r.dimensions && r.dimensions.deviceType,
      count: r.count
    })),
    byBrowser: (account.byBrowser || []).map((r) => ({
      browser: r.dimensions && r.dimensions.userAgentBrowser,
      count: r.count
    }))
  }, 200, { "cache-control": "public, max-age=300" });
}

function clampDays(n) {
  if (!Number.isFinite(n)) return 7;
  if (n < 1) return 1;
  if (n > 90) return 90;
  return n;
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

// --- HTTP Basic Auth, same realm as /insights/[[path]].js ---

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
    return { error: true, response: authChallenge() };
  }

  let decoded;
  try {
    decoded = atob(header.slice(6).trim());
  } catch (e) {
    return { error: true, response: authChallenge() };
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return { error: true, response: authChallenge() };

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (!constantTimeEquals(user, expectedUser) || !constantTimeEquals(pass, expectedPass)) {
    return { error: true, response: authChallenge() };
  }

  return { error: false };
}

function authChallenge() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "content-type": "application/json"
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
