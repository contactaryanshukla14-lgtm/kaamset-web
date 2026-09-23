# KaamSet architecture and deployment

The public frontend is a separate React/Vite repository deployed to Vercel. It calls a narrow guest API on the existing Foundation backend deployed to Railway. The Foundation API and worker continue to serve existing authenticated client workspaces. KaamSet uses new, isolated PostgreSQL tables and a separate single-flight BullMQ queue.

```text
Browser (Vercel)
   |
   | opaque 24-hour guest token
   v
Foundation API /v1/foundation/kaamset
   |  token and session RLS, quota ledger, fixed resource policy
   v
KaamSet queue (concurrency 1) -> Foundation worker
   | Gemini intent classification + trusted merchant rules
   | fixed Composio test-owner connection
   +-> dedicated fictional Google Calendar
   +-> dedicated fictional Google Sheet
```

The API issues a random 32-byte token. Only its hash is stored. Session and turn records are scoped by database RLS. Browser requests cannot select a LegacyWorkforce tenant, provider account, destination, tool or external resource. Calendar events use a deterministic ID based on the booking UUID. Every provider write is followed by a GET readback. An uncertain write is held for reconciliation and never repeated blindly. Guest turns cannot occupy the client worker queue.

Configuration on both Railway services is server side: `KAAMSET_DEMO_ENABLED`, `KAAMSET_DEMO_KILL_SWITCH`, `KAAMSET_DEMO_ORIGIN`, `KAAMSET_DEMO_PROVIDER_USER_ID`, `KAAMSET_DEMO_CALENDAR_ACCOUNT_ID`, `KAAMSET_DEMO_CALENDAR_ID`, `KAAMSET_DEMO_SHEETS_ACCOUNT_ID`, `KAAMSET_DEMO_SHEET_ID`, and the three daily limits. No values are in the frontend bundle. See the backend repository's `docs/kaamset-demo.md` for rollback and verification.

The kill switch disables guest access. Migration 047 is additive. To roll back code, turn on the kill switch before reverting API and worker releases. Keep the migration so existing client tables and routes are unaffected.

## Current capability boundary

| Capability | State |
| --- | --- |
| Fictional merchant policies and pricing | Implemented in isolated profiles |
| Guest chat and session memory | Implemented |
| Live Calendar availability and booking readback | Implemented; production journey verification pending |
| Fixed Sheet booking record and readback | Implemented; production journey verification pending |
| Appointment reschedule and cancellation | Implemented; production journey verification pending |
| Pause and human takeover | Implemented |
| Personal brief advisor | Implemented; deployment and live verification pending |
| Public guest account connection | Not enabled; requires verified business ownership |
| Support cases and owner decisions | Planned |
| Scheduled follow-ups | Planned |
| Paytm payment integration | Not connected |

This table is updated after each live verification. A configured connection alone does not prove a completed provider action.

## Limited personal guest mode

A visitor can upload a short Markdown brief or answer guided business questions, then ask up to eight read-only advisor questions. The browser sends the brief with each question; the backend does not retain the brief or question. This path uses the same opaque guest token and global quota, calls Gemini directly, and cannot reach Composio tools, bookings, messaging, or client workspaces. Real account connection needs verified ownership, scoped consent, and cleanup controls before it can be enabled for public guests.
