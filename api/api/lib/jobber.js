// This file has two jobs:
//   1. Keep a valid Jobber "access token" on hand at all times, refreshing it
//      automatically when it's about to expire (Jobber tokens only last 60 minutes).
//   2. Send requests to Jobber's API using that token.
//
// You should never need to edit this file. The other files in /api use it.

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const TOKEN_KEY = "jobber_tokens";

const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const JOBBER_GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
const JOBBER_GRAPHQL_VERSION = "2025-04-16"; // Jobber requires this header on every API call

// --- token storage -----------------------------------------------------

async function saveTokens(tokens) {
  // tokens = { access_token, refresh_token, expires_in }
  const record = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    // store the exact moment it expires, with a 2-minute safety buffer
    expires_at: Date.now() + (tokens.expires_in - 120) * 1000,
  };
  await redis.set(TOKEN_KEY, record);
  return record;
}

async function loadTokens() {
  return await redis.get(TOKEN_KEY);
}

// --- exchanging codes / refreshing --------------------------------------

// Called once, right after the one-time "Allow access" click in Jobber.
export async function exchangeCodeForTokens(code) {
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.JOBBER_CLIENT_ID,
      client_secret: process.env.JOBBER_CLIENT_SECRET,
      redirect_uri: process.env.JOBBER_REDIRECT_URI,
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`Jobber token exchange failed: ${res.status} ${await res.text()}`);
  }
  const tokens = await res.json();
  return await saveTokens(tokens);
}

async function refreshTokens(refresh_token) {
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.JOBBER_CLIENT_ID,
      client_secret: process.env.JOBBER_CLIENT_SECRET,
      refresh_token,
    }),
  });
  if (!res.ok) {
    throw new Error(`Jobber token refresh failed: ${res.status} ${await res.text()}`);
  }
  const tokens = await res.json();
  return await saveTokens(tokens);
}

// Always call this to get a token — it refreshes automatically if needed.
export async function getValidAccessToken() {
  let stored = await loadTokens();
  if (!stored) {
    throw new Error(
      "No Jobber connection found yet. Visit /api/authorize once and click Allow Access."
    );
  }
  if (Date.now() >= stored.expires_at) {
    stored = await refreshTokens(stored.refresh_token);
  }
  return stored.access_token;
}

// --- making API calls ----------------------------------------------------

export async function jobberGraphQL(query, variables = {}) {
  const token = await getValidAccessToken();
  const res = await fetch(JOBBER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-JOBBER-GRAPHQL-VERSION": JOBBER_GRAPHQL_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) {
    throw new Error(`Jobber API error: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}
