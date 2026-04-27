import crypto from "crypto";

const ACCOUNT_ID      = (process.env.NS_ACCOUNT_ID      ?? "").trim();
const CONSUMER_KEY    = (process.env.NS_CONSUMER_KEY    ?? "").trim();
const CONSUMER_SECRET = (process.env.NS_CONSUMER_SECRET ?? "").trim();
const TOKEN_ID        = (process.env.NS_TOKEN_ID        ?? "").trim();
const TOKEN_SECRET    = (process.env.NS_TOKEN_SECRET    ?? "").trim();

export const SUITEQL_URL = `https://${ACCOUNT_ID}.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql`;

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
    "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export function generateOAuthHeader(method: string, fullUrl: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const urlObj = new URL(fullUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  const queryParams: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: timestamp,
    oauth_token: TOKEN_ID,
    oauth_version: "1.0",
  };

  const allParams: Record<string, string> = { ...queryParams, ...oauthParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(TOKEN_SECRET)}`;

  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(signatureBaseString)
    .digest("base64");

  return (
    `OAuth realm="${ACCOUNT_ID}", ` +
    `oauth_consumer_key="${CONSUMER_KEY}", ` +
    `oauth_token="${TOKEN_ID}", ` +
    `oauth_signature_method="HMAC-SHA256", ` +
    `oauth_timestamp="${timestamp}", ` +
    `oauth_nonce="${nonce}", ` +
    `oauth_version="1.0", ` +
    `oauth_signature="${encodeURIComponent(signature)}"`
  );
}

export interface SuiteQLResponse<T = Record<string, unknown>> {
  items: T[];
  hasMore: boolean;
  offset: number;
  count: number;
  totalResults: number;
}

export async function suiteQL<T = Record<string, unknown>>(
  query: string
): Promise<T[]> {
  const url = `${SUITEQL_URL}?limit=1000&offset=0`;
  const auth = generateOAuthHeader("POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Prefer: "transient",
    },
    body: JSON.stringify({ q: query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NetSuite ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as SuiteQLResponse<T>;
  return data.items ?? [];
}
