# API integration structure

Client integration code is organized under `src/lib`:

- `api/` contains the API transport, RTK Query setup, and endpoint definitions.
- `stores/` contains the Redux store, typed hooks, and state slices. Demo submissions and preferences that need to be shared across pages are held in Redux.
- `data/mockData.ts` provides demo records that current pages still import.
- `types/` contains shared domain and API request/response types.

`mockData.ts` remains useful as read-only demo fixtures for workflows that are not server-backed. It is not a live database seed source and must never be treated as cloud-backed.

Pages should call endpoints through RTK Query and use Redux for shared client state. Do not persist application state in `localStorage` or `sessionStorage`. Redux state is in memory and resets on reload; authentication is restored by asking the server for the current user using its HTTP-only session cookies.

Ticket workflows use the server REST API through `src/lib/api/tickets/` and are not stored in the demo-data Redux slice. The `tickets` array in `mockData.ts` still supports demo-only analytics and screens that have not yet been migrated. Gate-pass requests/statuses, gate events, and profile/notification preferences remain session-only Redux interactions. The server has no asset-management endpoints yet, so ticket creation currently omits optional asset links in the client.

The server also provides IT-admin-only `GET /api/v1/auth/users`, `POST /api/v1/auth/users`, and `GET /api/v1/auth/departments`. The client people directory and invite form still use demo users and are not connected to those endpoints. User API fields differ from the mock UI model (for example `fullName`, `departmentId`, and uppercase role values); map them at the API boundary.

The Neon production branch now contains the Prisma schema, and the server's local `.env` is configured with its connection. The database currently has no user or demo rows, and the deployed server runtime has not yet been verified against Neon. Treat auth and ticket data as database-backed only when requests go through a server process configured with that connection; remaining demo fixtures and Redux interactions are not shared or durable.
