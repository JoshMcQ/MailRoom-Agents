# Connector Integrations

Connectors live in `packages/connectors` and expose a registry of typed clients:

```ts
const connectors = createConnectorRegistry();
await connectors.email.send({ ... });
```

## Email
- Normalises outbound payloads and supports mock mode when SMTP env vars are absent.
- Real sending uses a placeholder API endpoint; replace with SES, SendGrid, or direct SMTP as needed.

## GitHub / Jira / Linear
- `createIssue(payload)` validates via Zod, dedupes using optional `dedupe_key`, retried with `p-retry`.
- Without credentials they return structured mock IDs for testing.

## Zendesk / Freshdesk
- `createTicket(payload)` supports priority + tags.
- Mock results emitted when env vars missing.

## Notion / Airtable / Sheet
- `createFeedback(payload)` writes customer insights.
- Sheet destination is intentionally mock; extend with Google Sheets API.

## HubSpot / Salesforce
- `createLead(payload)` integrates through REST APIs. Salesforce branch uses mock until OAuth flow is configured.

## Slack
- `postMessage(channel, blocks)` posts escalation alerts. No-ops in mock mode.

All connectors:
- validate input schemas
- retry transient failures
- return `{ id, url, raw }`
- remain Deno-compatible via Web Crypto helpers (`utils.ts`).
