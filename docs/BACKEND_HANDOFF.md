# ITrack backend handoff

## Current integration status

This repository is a frontend prototype. It is **not connected to a backend or database**.

- Pages import seed records directly from `src/lib/mockData.js`; several dashboards aggregate those arrays in the browser.
- Ticket/pass submissions, pass decisions, gate events, demo accounts, and profile preferences use `sessionStorage`.
- `src/lib/apiClient.js` is transport scaffolding only. No page calls it yet, and no API endpoint names or payloads are frozen.
- `VITE_API_BASE_URL` and the optional Vite development proxy are configuration points, not proof that the app is using a live API.
- Browser route guards are for UI navigation only. Every authentication, role, ownership, approval, and data-access rule must be enforced by the server.

Agree the API contract and authentication model with the backend developer before wiring live data. The REST routes below are a proposal derived from the current UI, not an existing server contract.

## Frontend connection setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the API prefix the backend serves, such as `/api`.
3. If the API runs on a separate local origin, set `VITE_API_PROXY_TARGET` to that local origin. Vite proxies `/api` during development.
4. Restart Vite after changing environment variables.

Only public configuration belongs in `VITE_*` variables. Never put database credentials, signing keys, or other secrets in frontend environment variables.

`apiRequest('/resource')` sends JSON by default, includes same-site/session cookies, returns `null` for `204`, and throws `ApiError` for network, HTTP, or invalid-JSON errors. It supports `FormData` and `AbortSignal`. It does not store bearer tokens, refresh sessions, retry requests, or silently fall back to mock data.

## Suggested resource and endpoint map

Use the backend team's established naming and versioning if already decided. Prefer server-side pagination/filtering for list endpoints and explicit mutation endpoints for workflows.

| UI capability | Suggested API |
|---|---|
| Current user / sign in / sign out | `GET /auth/session`, `POST /auth/login`, `POST /auth/logout` |
| People directory / admin invite | `GET /users`, `POST /users` |
| Ticket queue and employee requests | `GET /tickets`, `POST /tickets`, `GET /tickets/:id`, `PATCH /tickets/:id` |
| Device register and registration | `GET /devices`, `POST /devices`, `GET /devices/:id`, `PATCH /devices/:id` |
| Gate-pass list/request | `GET /gate-passes`, `POST /gate-passes`, `GET /gate-passes/:id` |
| Pass approval/rejection | `POST /gate-passes/:id/decision` |
| Security item scan and movement | `POST /gate-passes/:id/scan`, `POST /gate-passes/:id/movements` |
| Gate activity | `GET /gate-events` |
| Stock and inventory | `GET /stock`, `POST /stock`, `PATCH /stock/:id` |
| Device-model catalogue | `GET /device-models`, `POST /device-models` |
| Locations/categories/SLA policy | `GET /locations`, `GET /categories`, `GET /sla-policies` |
| Reports | `GET /reports/summary?from=...&to=...` (or calculate from filtered resources) |
| Audit trail and notifications | `GET /audit-events`, `GET /notifications`, `PATCH /notifications/:id` |
| Profile and preferences | `GET /users/me/preferences`, `PUT /users/me/preferences` |

List endpoints should accept documented filters and return a consistent envelope, for example `{ "items": [], "page": 1, "pageSize": 25, "total": 0 }`. A summary endpoint should state its date range and aggregation rules. Do not label all-time seed-record calculations as a rolling period.

Suggested error body:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "A concise, user-safe explanation.",
  "details": {},
  "requestId": "server-generated-correlation-id"
}
```

The client also reads `X-Request-Id`. Do not send stack traces, SQL errors, credentials, or sensitive internal details to the browser.

## Entity relationships and current UI field expectations

Keep stable server-generated IDs and use foreign keys for relationships. Current UI records use these relationships:

- `Ticket.requesterId`, `Ticket.assigneeId` → `User.id`; `Ticket.deviceId` → `Device.id`.
- `Device.assigneeId` → `User.id`; asset `tag` is a unique human/scanner identifier.
- `GatePass.requesterId` → `User.id`; pass items reference a device by `tag` when tracked and may also represent accessories not in the device register.
- `GateEvent.passId` → `GatePass.id`; `deviceId` can be nullable for unregistered accessories, so preserve the scanned asset tag and item name in the event.
- `GateEvent.personId`, `GateEvent.loggedById` → `User.id`.
- Stock, device-model, location, category, notification, and audit records need their own stable IDs rather than relying on array positions or names.

Use ISO-8601 timestamps with timezone information for event times. Store dates as dates and timestamps as timestamps; the frontend currently contains date-only pass fields and older seed strings that need normalization when the API is introduced.

## Workflow and authorization rules to enforce on the server

- Authenticate every private API request. Prefer secure, HTTP-only cookies; define CSRF protection if cookie authentication is used.
- IT Admin-only: create users, make pass decisions, and manage administrative reference data. Do not trust a role sent by the browser.
- Employees may create tickets and pass requests, and may read only their own records and assigned assets unless policy explicitly grants more.
- Technicians may access the queues and records permitted by their role; assignment changes and ticket transitions need server-side validation.
- Security staff may verify a pass and log item-level exit/return/stop events. A pass must be approved before exit. A return must correspond to an active outstanding movement.
- Record who approved, rejected, scanned, changed, or returned an item, with timestamp and audit history. Repeated scan requests should be idempotent or rejected safely.
- Calculate SLA state, overdue returns, derived counts, and permissions on the server or document which authoritative service owns each value.
- Validate all IDs, statuses, dates, item tags, serials, quantities, role transitions, and request ownership on the server.

The current UI has demo-only PIN/signature affordances and does not provide real signatures, identity proof, QR verification, scanner hardware integration, or a backend audit guarantee. These require explicit product/security decisions before production.

## Frontend wiring work remaining

The backend connection is not complete until these changes are made:

1. Replace `AuthContext` seed-password/session-account logic with `GET /auth/session`, login, logout, and server-provided current-user data. Remove the demo selector/password disclosure from the live login experience.
2. Add async data hooks/services for users, tickets, devices, passes, stock, notifications, reports, and gate events. Replace direct imports from `mockData.js` in pages and navigation.
3. Replace `sessionData.js` reads/writes and profile `sessionStorage` mutations with server queries and mutations. Refresh/invalidate the related UI after successful writes; show loading, empty, validation, expired-session, and server-error states.
4. Make page mutations wait for the server response; do not show a success state or update the gate log optimistically unless rollback/error behavior is implemented.
5. Add pagination/filter query parameters to large lists and abort stale requests when the route/filter changes.
6. Configure production API origin, CORS, cookie attributes, CSRF, HTTPS, and deployment rewrites with the backend/operations team.
7. Add integration tests for each role and protected mutation, including cross-user access denial, pass approval/scan/return, and session expiry.

Primary files currently coupled to mock/session data include `src/contexts/AuthContext.jsx`, `src/lib/mockData.js`, `src/lib/sessionData.js`, `src/components/Sidebar.jsx`, and pages `Home.jsx`, `Tickets.jsx`, `Devices.jsx`, `DeviceDetailPage.jsx`, `GatePasses.jsx`, `GateStationKiosk.jsx`, `EmployeePortal.jsx`, `Team.jsx`, `Stock.jsx`, `Reports.jsx`, `AdminWorkspace.jsx`, `Settings.jsx`, `TechnicianHome.jsx`, and `RegisterDevice.jsx`.

## Open decisions for the backend handoff

- Backend language/framework, database, hosting, API versioning, and final endpoint/payload conventions.
- Identity provider versus application-managed accounts; cookie session and CSRF strategy.
- Whether device tags and staff IDs are globally unique, and how asset accessories are represented.
- Ticket status/SLA transition rules, working calendar/timezone, and reporting-period definitions.
- Pass lifecycle, partial returns, multiple gates, and whether a pass may contain unregistered items.
- Which settings/reference-data screens are in the first backend release.
- File upload/storage policy for ticket attachments and model-library files.
