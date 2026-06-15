import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Cliente único de Google Analytics 4 para todas las rutas /api/analytics.
 *
 * Transporte:
 *  - Por defecto usa **gRPC** (binario) en producción. Es el más fiable cuando la
 *    red permite salida a googleapis y evita el bug del transporte REST
 *    (`toProto3JSON: don't know how to convert value 50`, por el campo int64 `limit`).
 *  - En **desarrollo** usa REST (HTTPS) para sortear el DNS intermitente local
 *    hacia `analyticsdata.googleapis.com` (gRPC fallaba con `Name resolution failed`).
 *  - Se puede forzar con la variable de entorno `GA_TRANSPORT=rest|grpc`.
 *
 * `runReport` añade REINTENTOS ante errores de red transitorios y normaliza el
 * campo `limit` a string (los int64 numéricos rompen el serializador REST).
 */
const transport = process.env.GA_TRANSPORT;
const useRest = transport === "rest" || (transport !== "grpc" && process.env.NODE_ENV !== "production");

const base = new BetaAnalyticsDataClient({
  ...(useRest ? { fallback: "rest" as const } : {}),
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

/** El campo int64 `limit` debe ir como string para no romper el serializador REST. */
function normalize(request: RunReportParams): RunReportParams {
  if (request && typeof request === "object" && request.limit != null) {
    return { ...request, limit: String(request.limit) };
  }
  return request;
}

/**
 * Reemplazo directo de `analyticsDataClient` en las rutas: misma firma
 * `runReport(request)` que devuelve `[response]`, pero con reintentos y `limit`
 * normalizado.
 */
export const analyticsDataClient = {
  runReport: (request: RunReportParams) => withRetry(() => base.runReport(normalize(request))),
};
