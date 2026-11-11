# ITrack backend handoff

## Current integration status

Authentication and basic IT-admin user/department management are connected to the ITrack server. Most operational workflows remain prototypes and are **not yet backed by server data**.

- Pages still import seed records directly from `src/lib/data/mockData.ts`; several dashboards aggregate those arrays in the browser.
- Ticket/pass submissions, pass decisions, gate events, and profile/notification preferences are demo-only Redux state and reset on reload.
- Authentication uses RTK Query and the server's `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me` endpoints. The server sets HTTP-only session and refresh cookies; the client includes credentials and refreshes the session after an authorized request receives `401`.
- IT Admin user and department operations use `GET /api/v1/auth/users`, `POST /api/v1/auth/users`, and `GET /api/v1/auth/departments`. Create-user requests use server fields such as `fullName`, `departmentId`, and uppercase role enum values; use the live DTO and response types rather than the mock UI shape.
- These user/department endpoints are not wired into the client yet: the people directory still reads fixture users and the invite action remains intentionally unavailable.
- Password reset is not currently available.
- `src/lib/api/` contains the RTK Query auth endpoints and shared transport; `src/lib/api/apiClient.ts` is generic transport scaffolding for other resources.
- The server uses PostgreSQL/Prisma support, but operational resources are not yet API-backed. Confirm the configured server data source and deployed database before describing any data as persistent.
- Browser route guards are for UI navigation only. Every authentication, role, ownership, approval, and data-access rule must be enforced by the server.

Agree the remaining API contracts with the backend developer before wiring live data. Routes below are proposals unless specifically identified as existing.

## Frontend connection setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the API prefix the backend serves, currently `/api/v1`.
3. If the API runs on a separate local origin, set `VITE_API_PROXY_TARGET` to that local origin. Vite proxies `/api` during development.
4. Restart Vite after changing environment variables.

Only public configuration belongs in `VITE_*` variables. Never put database credentials, signing keys, or other secrets in frontend environment variables.

Authentication requests use RTK Query's `appBaseQuery`, which sends cookies, refreshes expired sessions, and retries authorized requests. `apiRequest('/resource')` is a separate transport helper for future resource integration; it sends JSON by default, includes same-site/session cookies, returns `null` for `204`, and throws `ApiError` for network, HTTP, or invalid-JSON errors.

## Suggested resource and endpoint map

Use the backend team's established naming and versioning if already decided. Prefer server-side pagination/filtering for list endpoints and explicit mutation endpoints for workflows.

| UI capability | Suggested API |
|---|---|
| Current user / sign in / refresh / sign out (existing) | `GET /auth/me`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Password recovery (missing) | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| People directory / admin invite (server exists; client wiring pending) | `GET /auth/users`, `POST /auth/users`; department lookup: `GET /auth/departments` |
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

1. Password recovery still needs a server contract and delivery/security design. Wire the existing user directory and admin user-creation endpoints to the client using their server DTOs and response types.
2. Add async RTK Query endpoints for tickets, devices, passes, stock, notifications, reports, and gate events. Replace direct imports from `src/lib/data/mockData.ts` in pages and navigation as each resource API becomes available.
3. Replace the current Redux-only demo ticket/pass/event/profile state with server queries and mutations when those endpoints are available. Refresh/invalidate the related UI after successful writes; show loading, empty, validation, expired-session, and server-error states.
4. Make page mutations wait for the server response; do not show a success state or update the gate log optimistically unless rollback/error behavior is implemented.
5. Add pagination/filter query parameters to large lists and abort stale requests when the route/filter changes.
6. Configure production API origin, CORS, cookie attributes, CSRF, HTTPS, and deployment rewrites with the backend/operations team. Cross-origin web clients require an exact allowed origin with credentials; production cookies must also be usable in the client's site context.
7. Add integration tests for each role and protected mutation, including cross-user access denial, pass approval/scan/return, and session expiry.

Primary files currently coupled to mock/demo data include `src/lib/data/mockData.ts`, `src/lib/stores/demo-data-slice.ts`, `src/components/Sidebar.tsx`, and pages `Home.tsx`, `Tickets.tsx`, `Devices.tsx`, `DeviceDetailPage.tsx`, `GatePasses.tsx`, `GateStationKiosk.tsx`, `EmployeePortal.tsx`, `Team.tsx`, `Stock.tsx`, `Reports.tsx`, `AdminWorkspace.tsx`, `Settings.tsx`, `TechnicianHome.tsx`, and `RegisterDevice.tsx`.

## Open decisions for the backend handoff

- Hosting, production database configuration, API versioning, and final endpoint/payload conventions for operational resources.
- Identity provider versus application-managed accounts; cookie session and CSRF strategy.
- Whether device tags and staff IDs are globally unique, and how asset accessories are represented.
- Ticket status/SLA transition rules, working calendar/timezone, and reporting-period definitions.
- Pass lifecycle, partial returns, multiple gates, and whether a pass may contain unregistered items.
- Which settings/reference-data screens are in the first backend release.
- File upload/storage policy for ticket attachments and model-library files.
