# ITrack backend handoff

## Current v1 integration

The browser uses the server API; it does not connect directly to Neon/PostgreSQL. Authentication uses HTTP-only cookies and RTK Query. The current server includes:

- Authentication, current-user, refresh/logout, and IT-admin user/department endpoints under `/api/v1/auth`.
- Tenant-scoped ticket workflows under `/api/v1/tickets`.
- Tenant-scoped asset list/detail/create/update/retire endpoints under `/api/v1/assets`.
- IT Admin/Technician dashboard summary at `/api/v1/dashboard/summary`.

The client maps server enums and response envelopes at API boundaries. Keep authorization, ownership, tenant scoping, and derived business rules enforced by the server. `VITE_API_BASE_URL` is public client configuration only; database credentials and signing secrets belong on the server.

## Not in the v1 API

The current server has no confirmed persistent endpoints for:

- Gate-pass requests, approvals, slips, or item-level exit/return/stop movements.
- Stock/inventory and 3D model files.
- Location management or SLA policy configuration.
- Audit-event feeds, notifications, or user profile preferences.
- Separate date-range reporting beyond the implemented dashboard summary.

These features must remain unavailable to users: keep their routes and navigation commented out, show no sample records, and do not create client queries for proposed endpoints. Existing prototype code should carry a `TODO(v2)` note and only be restored after the backend API, DTOs, persistence, authorization, and error behavior are implemented.

## Deployment and persistence

The server uses Prisma/PostgreSQL and the project documents a Neon production branch. The client must always retrieve application data through the server API. A configured database URL alone does not prove that a particular deployment or resource is backed by it; verify the server environment and resource implementation before claiming production persistence.

For cross-origin deployments, configure the exact frontend origin in the server's `CORS_ORIGINS` environment setting, with credentials enabled. Do not hard-code deployment origins in client code or edit server CORS configuration as part of a client-only change.

## Adding a future workflow

1. Verify the server controller, DTO, service, authorization, persistence, and response shape.
2. Coordinate any server/schema change with the backend repository; do not infer an API from this handoff.
3. Add a typed RTK Query endpoint under `src/lib/api/<resource>/` using `appApi`.
4. Replace the v2 TODO with live query/mutation UI and explicit loading, empty, validation, and error states.
5. Add focused tests for response mapping and the route's supported states.
6. Enable the route and navigation only after server and client validation succeeds.
