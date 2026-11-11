# ITrack Client Agent Guide

## System overview

ITrack is a role-based IT support and asset-management application. The client is React 19, TypeScript, Vite, React Router, Tailwind CSS, Redux Toolkit, and RTK Query. Keep the existing layout, route behavior, role-specific workflows, and visual design intact when changing data sources.

Key areas:

- `src/App.tsx`: role-protected route tree for IT Admin, Technician, Employee, and Security workspaces.
- `src/components/`: shared shell, navigation, badges, asset tags, and access guard.
- `src/pages/`: workflow screens and dashboards.
- `src/lib/api/`: RTK Query base API, cookie-aware transport, and endpoint slices.
- `src/lib/stores/`: Redux store, typed hooks, authentication, and session-only demo state.
- `src/lib/types/`: shared UI/domain types and server API request/response types.
- `src/lib/data/mockData.ts`: relational demo fixtures and derived dashboard data.
- `src/hooks/` and `src/contexts/`: shared authentication/session adapters.

Read `README.md`, `docs/API_INTEGRATION.md`, and `docs/BACKEND_HANDOFF.md` before changing application data flows. Treat the current source and server API as authoritative where an older handoff note differs.

## Backend and data boundary

Authentication is server-backed through `/api/v1/auth` and RTK Query. The server uses HTTP-only cookies; the client includes credentials and handles session refresh. The existing server also provides admin user and department endpoints. Most other product areas (tickets, assets, passes, gate activity, stock, reports, and preferences) remain prototypes backed by `mockData.ts` and/or Redux demo state until their server endpoints are implemented.

`VITE_API_BASE_URL` is public client configuration. Database URLs, signing keys, passwords, and other secrets belong only in the server's environment; never put them in a `VITE_*` variable, client bundle, fixture, test snapshot, or agent file.

## Replacing mock data after the server database/API is ready

When asked to connect a workflow to persistent data:

1. Verify the server endpoint and contract exist and are backed by the configured persistent repository. A connection string alone does not mean every resource or workflow is implemented. Coordinate with the server repository when its schema, endpoint, or authorization behavior must change.
2. Read the actual server DTOs/responses and `src/lib/types/api-types.ts`. Do not treat proposed routes in handoff documents as implemented routes. Preserve explicit response envelopes and map server fields (including server role enums and user names) at a typed boundary rather than changing display behavior throughout the UI.
3. Add typed RTK Query endpoints under `src/lib/api/` using the shared `appApi`, cookie-aware `appBaseQuery`, and the established tag invalidation patterns. Keep authentication in the existing auth API.
4. Replace direct fixture reads in pages, components, and derived dashboards with query data in a coherent workflow. Search the whole client for imports from `src/lib/data/mockData.ts`; do not delete the fixture or its exports while active screens still depend on them.
5. Replace the corresponding Redux demo-state mutations only when the server owns that data. Keep genuinely transient UI state in Redux; do not shadow server data with a second local copy or silently fall back to fixtures after a request fails.
6. Preserve current role-scoped UX. The client guard is navigation UX only; authorization, ownership, approval, validation, and tenant scoping must be enforced by the server.
7. Represent loading, empty, validation, expired-session, and server-error states explicitly. Wait for writes to succeed before showing success; use RTK Query invalidation/refetch or documented optimistic updates with rollback.
8. Keep all mock fixtures clearly demo-only. Do not bulk-seed production records from `mockData.ts` unless the user explicitly requests a reviewed import/mapping plan.

For a complete replacement, verify that pages no longer consume fixture records or demo mutations for the migrated resource, and that the existing UI and role workflows still behave consistently.

## Validation

Use the project scripts: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Add or update focused tests for API response mapping, query/mutation behavior, and error/loading states. Report any environment-specific build failure separately from TypeScript, lint, or test results.
