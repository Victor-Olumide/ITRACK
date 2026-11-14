# ITrack Client Agent Guide

## System overview

ITrack is a role-based IT support and asset-management application. The v1 client supports Employee, Technician, and IT Admin workspaces; the server retains legacy Security/P5 values for compatibility, but the client must not expose those workflows. The client is React 19, TypeScript, Vite, React Router, Tailwind CSS, Redux Toolkit, and RTK Query. Keep the existing layout, route behavior, role-specific workflows, and visual design intact when changing data sources.

Key areas:

- `src/App.tsx`: application entry point.
- `src/router.tsx`: role-protected route tree for IT Admin, Technician, and Employee workspaces.
- `src/components/`: shared shell, navigation, badges, asset tags, and access guard.
- `src/pages/`: workflow screens and dashboards.
- `src/lib/api/`: RTK Query base API, cookie-aware transport, and domain endpoint folders such as `auth/` and `tickets/`.
- `src/lib/stores/`: Redux store, typed hooks, and authentication state. RTK Query owns server state.
- `src/lib/api/<resource>/`: typed server request/response contracts and RTK Query endpoints.
- `src/types/`: shared UI/domain types.
- `src/hooks/auth/` and `src/contexts/`: authentication/session hooks and adapters.

Read `README.md`, `docs/API_INTEGRATION.md`, and `docs/BACKEND_HANDOFF.md` before changing application data flows. Treat the current source and server API as authoritative where an older handoff note differs.

## Backend and data boundary

Authentication is server-backed through `/api/v1/auth` and RTK Query. The server uses HTTP-only cookies; the client includes credentials and handles session refresh. The current server also provides IT-admin user and department endpoints, REST ticket endpoints, `/api/v1/assets`, and `/api/v1/dashboard/summary`.

The current v1 client may query only implemented endpoints. Gate passes, gate movements, stock, 3D models, location management, SLA policy editing, audit events, notifications, and profile preferences do not have confirmed server APIs. Their routes must remain commented out in `src/router.tsx`, with `TODO(v2)` notes; do not expose prototype screens or create speculative RTK Query endpoints. Keep a concise unavailable-state component only where a role needs a safe landing route.

`VITE_API_BASE_URL` is public client configuration. Database URLs, signing keys, passwords, and other secrets belong only in the server's environment; never put them in a `VITE_*` variable, client bundle, fixture, test snapshot, or agent file.

## Replacing mock data after the server database/API is ready

When asked to connect a workflow to persistent data:

1. Verify the server controller, DTO, service, and persistence contract exist. A connection string alone does not mean every resource or workflow is implemented. Coordinate with the server repository when its schema, endpoint, or authorization behavior must change.
2. Read the actual server DTOs/responses and the owning API types under `src/lib/api/<resource>/`. Do not treat proposed routes in handoff documents as implemented routes. Preserve explicit response envelopes and map server fields (including server role enums and user names) at a typed boundary rather than changing display behavior throughout the UI.
3. Add typed RTK Query endpoints under `src/lib/api/` using the shared `appApi`, cookie-aware `appBaseQuery`, and the established tag invalidation patterns. Keep authentication in the existing auth API.
4. Replace direct fixture reads in pages, components, and derived dashboards with query data in a coherent workflow. Never present fixture or browser-only state as server data.
5. Keep genuinely transient UI state in Redux; do not shadow server data with a second local copy or silently fall back to fixtures after a request fails.
6. Preserve current role-scoped UX. The client guard is navigation UX only; authorization, ownership, approval, validation, and tenant scoping must be enforced by the server.
7. Represent loading, empty, validation, expired-session, and server-error states explicitly. Wait for writes to succeed before showing success; use RTK Query invalidation/refetch or documented optimistic updates with rollback.
8. Keep all mock fixtures clearly demo-only. Do not bulk-seed production records from `mockData.ts` unless the user explicitly requests a reviewed import/mapping plan.

For a complete replacement, verify that pages no longer consume fixture records or demo mutations for the migrated resource, and that the existing UI and role workflows still behave consistently.

## Mandatory React and Redux conventions

These rules are required. Do not restructure the application around a new architecture without an explicit request. Preserve the current system boundaries and role workflows.

- Keep shared transport and RTK Query setup in `src/lib/api/`. Keep resource endpoints and their request/response types together under `src/lib/api/<resource>/`; do not consolidate unrelated contracts into a global API type dump.
- Keep authentication hooks in `src/hooks/auth/`. Do not create a `src/features/` tree or add barrel/re-export layers that only forward one symbol. Import the owning endpoint or type module directly when that is clearer.
- Use the existing `appApi`, `appBaseQuery`, typed Redux hooks, and tag invalidation conventions. Do not create another API client/store for a resource already served by RTK Query.
- Treat RTK Query as the owner of server state. Do not copy query results into Redux, local state, or fixtures; keep only transient form/view state locally and use mutations plus invalidation/refetch for server writes.
- Use React 19 and the installed React Compiler/team conventions. Do not add `useMemo` or `useCallback` by default; use them only when there is a measured or semantic reason and follow existing nearby patterns. Do not introduce effects to derive values that can be calculated during render.
- Use current React patterns and APIs only when they solve a concrete issue; do not add `useEffectEvent`, transitions, or deferred values mechanically.
- For reusable/common UI such as dialogs, menus, and form controls, use the installed shadcn/ui components under `src/components/ui/` before building custom primitives. Override component defaults with ITrack's existing colors, typography, and interaction styles; do not introduce shadcn's default theme in place of the app theme.
- Preserve existing route structure, visual language, role-specific navigation, accessibility, and responsive behavior when changing a data source. Add explicit loading, empty, validation, unauthorized, and server-error states.
- The client is not an authorization boundary. Never trust client-supplied role, ownership, organization, approval, status, or derived SLA values; the server must enforce these rules.
- Do not add mock fixtures, demo records, or browser-only mutations to represent persistent application data.
- For unavailable v1 workflows, comment out their routes and navigation entries in `src/router.tsx` and add a `TODO(v2)` note. Re-enable them only after the actual server API and persistence behavior are implemented and verified.
- Before changing a workflow, read this guide plus `README.md`, `docs/API_INTEGRATION.md`, and `docs/BACKEND_HANDOFF.md`. Current server controllers/DTOs and this repository's actual code outrank proposed routes in older docs.

## Validation

Use the project scripts: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Add or update focused tests for API response mapping, query/mutation behavior, and error/loading states. Report any environment-specific build failure separately from TypeScript, lint, or test results.
