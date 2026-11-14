# ITrack

A desktop-class IT support ticket and asset management web app for Employees, Technicians, and IT Admins. Manage helpdesk tickets and hardware assets using the server-backed v1 workflows.

> **Status:** Active development · v1 workflows use implemented server APIs; unsupported v2 routes are disabled

---

## Tech stack

| Layer | Library / Tool |
|---|---|
| Framework | React 19 (via Vite) |
| Routing | React Router v8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Build | Vite 8 |
| Linting | ESLint 10 |

---

## Getting started

```bash
# Clone
git clone https://github.com/ITrack-App/ITRACK.git
cd ITRACK

# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# API transport tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## Role UI routes

| Workspace | Route |
|---|---|
| IT Admin | `/` |
| Technician | `/technician` |
| Employee | `/employee` |
| Sign in | `/login` |
| Account management | `/people` |

The UI requires a server-authenticated user and checks role access for each workspace. Sign-in, current-session lookup, refresh, sign-out, profile name/password changes, IT-admin user/department management, tickets, assets, and dashboard summary use implemented `/api/v1` endpoints. Password changes require the current password and end all active sessions; IT Admins can update other users' names and roles. Password recovery is not available, so contact an IT administrator if you cannot sign in.

The client does not use mock records or session-only demo mutations for application data. Gate passes, gate movements, stock, model library, location management, SLA policy editing, audit events, notifications, profile preferences, and the legacy Security workspace are not part of v1. Their routes and navigation entries are disabled and marked for v2; do not expose those prototype workflows until persistent server APIs are available. Ticket overdue status is server-provided; the client does not invent SLA progress.

## Backend handoff

API responses are the source of truth for supported workflows; configuring `VITE_API_BASE_URL` does not make an unimplemented endpoint available. See [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md) for the current data boundary and v2 work. Copy `.env.example` to `.env.local` for local API configuration. Cross-origin deployments also require the backend to allow the exact client origin with credentials and issue cookies usable by that client.

Gate-pass and security-scanning routes are disabled until the server provides persistent endpoints and authorization for those workflows.

---

## Project structure

```
src/
├── lib/
│   ├── api/                 # API transport and RTK Query endpoints
│   ├── stores/              # Redux store, auth, and RTK Query cache
│   └── types/               # API and UI types
├── components/              # Shared application components
├── contexts/                # Auth context adapter over Redux/API auth
├── hooks/                   # Shared application hooks
└── pages/                   # Route-level screens
```

---

## API availability

| Workflow | v1 client data source | Availability |
|---|---|---|
| Authentication, users, departments | `/api/v1/auth/*` | Available |
| Tickets and ticket history | `/api/v1/tickets/*` | Available |
| Assets | `/api/v1/assets/*` | Available |
| Dashboard summary | `/api/v1/dashboard/summary` | Available to IT Admins and Technicians |
| Gate passes, gate movement, stock, model library, locations, SLA policy, audit, notifications, preferences, Security workspace | None | Disabled; tracked for v2 |

---

## Design tokens

| Token | Value | Usage |
|---|---|---|
| App background | `#f4f6fc` | Main content area |
| Sidebar / nav | `#0B184C` | Dark navy shell |
| Accent blue | `#3155ff` | Buttons, active states |
| Asset tag bg | `#d4f933` | Device tag background |
| Asset tag text | `#445b0f` | Device tag foreground |
| Critical / Breached | red-100 / red-700 | SLA and priority badges |
| High priority | orange-100 / orange-700 | Ticket priority badge |
| Medium priority | blue-100 / blue-700 | Ticket priority badge |
| Low priority | slate-100 / slate-600 | Ticket priority badge |

---

## Page progress

### Everyone
| ID | Page | Status |
|---|---|---|
| W01 | Sign in | ✅ |
| W02 | Reset password | v2 · API unavailable |
| W18 | Notifications | v2 · API unavailable |
| W19 | Profile and preferences | v2 · API unavailable |
| W20 | No access / not found / offline | ✅ |
| W21 | Empty states | 🔲 |
| W22 | Session expired (popup) | v2 · API unavailable |
| W23 | Toasts (popup) | 🔲 |

### Employees
| ID | Page | Status |
|---|---|---|
| W04 | Employee home | ✅ |
| W07 | Report a problem | ✅ |
| W08 | My tickets and status | ✅ |
| W14 | Request a gate pass | v2 · API unavailable |

### IT Admin & Technicians
| ID | Page | Status |
|---|---|---|
| W03 | Home dashboard | ✅ |
| W05 | Tickets queue and detail | ✅ |
| W09 | Devices, hover to turn | ✅ |
| W10 | Device 3D viewer | v2 · model API unavailable |
| W11 | Register a device | ✅ |
| W12 | 3D model library | v2 · API unavailable |
| W13 | Gate pass approvals | v2 · API unavailable |
| W25 | Stock and licences | v2 · API unavailable |
| W26 | Audit trail | v2 · API unavailable |
| W15 | Reports | ✅ |
| W16 | People and roles | ✅ |
| W17 | Categories and SLA targets | Category counts available; SLA controls are v2 |
| W24 | Resolve / reassign / retire dialogs (popup) | 🔲 |

---

## Contributing

1. Branch off `main` — use `feat/`, `fix/`, or `chore/` prefixes.
2. Keep each page or component in one commit with a clear message.
3. Run `npm test`, `npm run lint`, and `npm run build` before opening a PR — all must pass.
4. Follow [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md) when replacing the demo data sources with asynchronous API services.
