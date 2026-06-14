import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Cliente único de Google Analytics 4 para todas las rutas /api/analytics.
 *
 *  - `fallback: 'rest'`  → usa HTTPS estándar en vez de gRPC (más compatible con
 *    proxies/firewalls; gRPC fallaba aquí con "Name resolution failed").
 *  - `runReport` con REINTENTOS → en esta red el DNS hacia
 *    `analyticsdata.googleapis.com` resuelve de forma intermitente (a veces
 *    `getaddrinfo ENOTFOUND`). Como casi siempre resuelve, unos pocos reintentos
 *    con backoff hacen la conexión fiable.
 */
const base = new BetaAnalyticsDataClient({
  fallback: "rest",
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const TRANSIENT =
  /ENOTFOUND|UNAVAILABLE|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|Name resolution|getaddrinfo|socket hang up|fetch failed|network|timeout/i;

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const transient = TRANSIENT.test(String(e?.message ?? ""));
      if (!transient || i === attempts - 1) throw e;
      // backoff: 300ms, 600ms, 900ms
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

type RunReportParams = Parameters<BetaAnalyticsDataClient["runReport"]>[0];

/**
 * Reemplazo directo de `analyticsDataClient` en las rutas: misma firma
 * `runReport(request)` que devuelve `[response]`, pero con reintentos.
 */
export const analyticsDataClient = {
  runReport: (request: RunReportParams) => withRetry(() => base.runReport(request)),
};
