# API integration structure

Client integration code is organized under `src/lib`:

- `api/` contains the API transport, RTK Query setup, and endpoint definitions.
- `stores/` contains the Redux store, typed hooks, and state slices. Demo submissions and preferences that need to be shared across pages are held in Redux.
- `data/mockData.ts` provides demo records that current pages still import.
- `types/` contains shared domain and API request/response types.

`mockData.ts` remains useful as the read-only seed source for demo devices, tickets, users, and other records. It is not cloud-backed.

Pages should call endpoints through RTK Query and use Redux for shared client state. Do not persist application state in `localStorage` or `sessionStorage`. Redux state is in memory and resets on reload; authentication is restored by asking the server for the current user using its HTTP-only session cookies.

Demo tickets, gate-pass requests/statuses, gate events, and profile/notification preferences are stored in Redux for the current page session only. These are local demo interactions, not server-persisted records. The server currently has no asset-management endpoints, so assets and related workflows are not yet API-backed.

The server also provides IT-admin-only `GET /api/v1/auth/users`, `POST /api/v1/auth/users`, and `GET /api/v1/auth/departments`. The client people directory and invite form still use demo users and are not connected to those endpoints. User API fields differ from the mock UI model (for example `fullName`, `departmentId`, and uppercase role values); map them at the API boundary.

There is **no active cloud database** connected to the application. Until a production database is configured and connected on the server, data must not be treated as cloud-persisted or shared across server restarts.
