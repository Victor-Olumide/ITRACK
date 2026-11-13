# API integration

The client uses RTK Query through `src/lib/api/app-api.ts` and the shared cookie-aware base query. Requests are relative to the configured `/api/v1` base URL and include HTTP-only session cookies. The browser never connects directly to PostgreSQL/Neon.

## Implemented v1 endpoints

Use the running server's controller, DTO, service, and response types as the contract. The endpoint list below reflects the server code currently present; older handoff proposals are not implemented contracts.

| Workflow | Implemented endpoints | Client module |
|---|---|---|
| Authentication/session | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | `src/lib/api/auth/` |
| IT-admin users/departments | `GET /auth/users`, `POST /auth/users`, `GET /auth/departments`, `PATCH /users/:id` | `src/lib/api/users/`, `src/lib/api/auth/` |
| Tickets | `GET/POST /tickets`, `GET/PATCH/DELETE /tickets/:id`, `POST /tickets/suggest`, `POST /tickets/:id/status`, `POST /tickets/:id/assign`, `POST /tickets/:id/comments` | `src/lib/api/tickets/` |
| Assets | `GET/POST /assets`, `GET/PATCH /assets/:id`, `POST /assets/:id/retire` | `src/lib/api/assets/` |
| Dashboard | `GET /dashboard/summary` | `src/lib/api/dashboard/` |

All private access, role checks, organization scoping, ownership, validation, and workflow transitions are enforced by the server. Client-side route guards only control navigation.

Asset lists are server-filtered and paginated (`q`, `type`, `condition`, `assignedToId`, `warrantyExpiringWithinDays`, `includeRetired`, `page`, and `pageSize`). Retired assets are excluded by default; explicitly request `condition=RETIRED` or `includeRetired=true` to query them. Asset details include server-persisted assignment history.

For Employees, `GET /assets` returns only assets assigned to the authenticated user. Ticket creation accepts an optional `assetId`; the server verifies organization and employee-assignment access before linking it.

Asset assignment history uses the additive server `asset_assignments` table. The backend requires a reviewed, non-destructive schema sync before this code is deployed to an environment that does not yet have that table.

The dashboard summary provides ticket counts by status, 30-day resolution/category metrics, server-calculated overdue tickets and technician workloads, asset counts by type/condition, and warranties expiring within 30 days. Do not calculate SLA progress or policy values in the client.

## Unsupported workflows

There are no confirmed v1 APIs for gate passes, gate movements/scans, stock, 3D models, locations, SLA policy editing, audit events, notifications, or profile preferences. Do not define RTK Query endpoints or show fixture-backed interfaces for these resources. Their routes and navigation entries stay commented out in `src/router.tsx`; mark future work with `TODO(v2)` and restore it only after the server contract and persistence behavior exist.

Dashboard and report screens may use only the implemented dashboard, ticket, and asset endpoints. Do not infer SLA compliance, gate activity, or other server-owned values from client data.

## Client behavior

- Keep API request/response types next to their endpoint module and map server enums/fields at a typed boundary.
- Treat RTK Query as the owner of server state. Keep only transient form/view state locally.
- Restore the current user once when a protected route is loaded in a new browser page; do not recheck on ordinary client-side navigation. If the access session has expired, try the refresh cookie once before requiring sign-in.
- Represent loading, empty, validation, session-expired, and server-error states explicitly. Never fall back to demo data after a request fails.
- Wait for mutation success before showing confirmation; invalidate/refetch affected tags.
- The shared RTK Query request timeout is three minutes. This client-side limit cannot override a server, hosting, or proxy timeout.
- Ticket attachments are not supported yet: the report-page file picker is not submitted, and the server has no upload endpoint or attachment storage.
- Never put database URLs, passwords, signing keys, or other secrets in `VITE_*` variables, fixtures, tests, or agent instructions.
- Configure exact credentialed CORS origins on the server/deployment environment, not in client code.

For local development, copy `.env.example` to `.env.local`, configure `VITE_API_BASE_URL`, and set the Vite proxy target only when the server runs on a separate local origin.
