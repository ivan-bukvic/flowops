

## Goal
Replace the `GOOGLE_CALENDAR_EVENT` placeholder in `process-automation-logs` with a real Google Calendar API integration using a service account (JWT/OAuth2).

## Context confirmed
- Action type in code is `GOOGLE_CALENDAR_EVENT` (the rule builder uses this exact value). I'll keep that case but treat it as the trigger for real calendar event creation.
- Secrets already configured: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`. No new secrets needed.
- Rule config currently stores only `title` (`calendarTitle`). I'll derive sensible defaults for description/start/end and allow optional overrides from `config_json`.

## Implementation plan

### 1. Update `supabase/functions/process-automation-logs/index.ts`

Replace the `GOOGLE_CALENDAR_EVENT` case with real logic:

**a. Read secrets**
- `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`
- Throw a clear error if any is missing (so status flips to `failed`, not silent success).
- Normalize private key: replace literal `\n` with real newlines.

**b. Build & sign service account JWT**
- Header: `{ alg: "RS256", typ: "JWT" }`
- Claims:
  - `iss`: client email
  - `scope`: `https://www.googleapis.com/auth/calendar`
  - `aud`: `https://oauth2.googleapis.com/token`
  - `iat`: now (seconds)
  - `exp`: now + 3600
- Base64url-encode header + claims, sign with `RS256` using Web Crypto:
  - Convert PEM private key → DER → `crypto.subtle.importKey("pkcs8", …, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, …, ["sign"])`
  - `crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data)`
  - Base64url-encode signature
- Concatenate `header.claims.signature`

**c. Exchange JWT for access token**
- `POST https://oauth2.googleapis.com/token`
- Body (form-encoded): `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JWT>`
- Throw with full body on non-2xx
- Extract `access_token`

**d. Create the calendar event**
- `POST https://www.googleapis.com/calendar/v3/calendars/{encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
  ```json
  {
    "summary": config.title || config.summary || `Automation: ${event.type}`,
    "description": config.description || `Triggered by event ${event.type}\nMetadata: ${JSON.stringify(event.metadata)}`,
    "start": { "dateTime": config.start_datetime || nowISO, "timeZone": config.timezone || "UTC" },
    "end":   { "dateTime": config.end_datetime   || nowPlus1hISO, "timeZone": config.timezone || "UTC" }
  }
  ```
- On non-2xx: throw with status + full response body (caught by outer try → status `failed`, `last_error` populated, `result_json = { error }`).
- On success: `resultJson = { event_id, html_link, calendar_id, summary }`; status stays `completed`.

### 2. No DB / config / frontend changes
- `automation_rules.config_json` already accepts arbitrary JSON, so optional `description`, `start_datetime`, `end_datetime`, `timezone` are stored without schema changes.
- The existing outer try/catch already maps thrown errors to `status = "failed"` and writes `last_error` + `result_json.error` — exactly the "no silent success" behavior requested.

### 3. Verification
- After deploy, the Edge Function picks up pending logs from the existing trigger pipeline.
- Manually create a `GOOGLE_CALENDAR_EVENT` rule with a `title`, fire its trigger, and confirm:
  - Log row goes from `pending` → `completed`
  - `result_json` contains the Google event ID + html link
  - Event appears on the configured Google Calendar

## Files to edit
- `supabase/functions/process-automation-logs/index.ts` — replace the `GOOGLE_CALENDAR_EVENT` case with real JWT-signed API integration; add small helpers (`base64url`, `pemToPkcs8`, `getAccessToken`).

