# ITrack

A desktop-class IT support ticket and asset management web app built for internal IT teams. Manage helpdesk tickets, track hardware assets, run gate-pass approvals, and monitor SLA performance — all from a single interface.

> **Status:** Active development · role-based UI prototypes in progress

---

## Tech stack

| Layer | Library / Tool |
|---|---|
| Framework | React 19 (via Vite) |
| Routing | React Router v7 |
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
| Security gate station | `/security` |
| Sign in | `/login` |
| Account management (client integration pending) | `/signup` or `/people` |

The UI requires a server-authenticated user and checks role access for each workspace. Sign-in, current-session lookup, refresh, and sign-out use the server's `/api/v1/auth` endpoints and HTTP-only cookies. The server exposes IT-admin user and department endpoints, but the client directory/invite screens are not wired to them yet. Password recovery is not available; contact an IT administrator for password resets.

Most non-authentication pages are still prototypes backed by seeded data. Demo ticket/pass submissions and gate-pass changes live in Redux memory only: they are shared across pages in the current app session, reset on reload, and are not sent to the backend.

## Backend handoff

Most application data is still mocked; configuring `VITE_API_BASE_URL` does not switch those pages to backend data. See [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md) for the current data boundaries and missing endpoints. Copy `.env.example` to `.env.local` for local API configuration. Cross-origin deployments also require the backend to allow the exact client origin with credentials and issue cookies usable by that client.

IT Admins and Technicians can preview and print an A4 gate-pass slip from the pass review dialog. Printed pass details come from the available demo records; signatures, gate release, and return checks are left for the relevant staff to complete.

The Security route opens a full-screen gate kiosk. It accepts tags typed by hand or sent as keyboard input by a scanner, loads the matching pass, and records a movement only after each pass item is verified. Scanner hardware connectivity and camera-based QR reading are not integrated in this frontend demo.

---

## Project structure

```
src/
├── lib/
│   ├── api/                 # API transport and RTK Query endpoints
│   ├── data/mockData.ts     # Relational seed data for the demo UI
│   ├── stores/              # Redux store, auth, and in-memory demo state
│   └── types/               # Domain and API types
├── components/              # Shared application components
├── contexts/                # Auth context adapter over Redux/API auth
├── hooks/                   # Shared application hooks
└── pages/                   # Route-level screens
```

---

## Mock data

Most UI demo records come from `src/lib/data/mockData.ts` — these are in-memory seed records, not cloud data. The file exports relational arrays whose IDs cross-reference each other:

| Export | Records | Description |
|---|---|---|
| `users` | 10 | Employees, Technicians, IT Admins, Security |
| `devices` | 16 | Laptops, Desktops, Monitors, Phones |
| `tickets` | 10 | Problems and requests with SLA state |
| `gatePasses` | 6 | Off-site device requests with item lists |
| `stock` | 7 | Accessories and consumables |
| `gateLog` | 8 | In / out / stopped events at the gate |

Lookup helpers (`userById`, `deviceById`, `deviceByTag`, `ticketById`, `gatePassById`, …) are exported alongside the arrays.

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
| At risk / High | orange-100 / orange-700 | SLA and priority badges |
| On track / Medium | blue-100 / blue-700 | SLA and priority badges |
| In store / Low | slate-100 / slate-600 | SLA and priority badges |

---

## Page progress

### Everyone
| ID | Page | Status |
|---|---|---|
| W01 | Sign in | ✅ |
| W02 | Reset password | ✅ |
| W18 | Notifications | ✅ |
| W19 | Profile and preferences | ✅ |
| W20 | No access / not found / offline | 🔲 |
| W21 | Empty states | 🔲 |
| W22 | Session expired (popup) | 🔲 |
| W23 | Toasts (popup) | 🔲 |

### Employees
| ID | Page | Status |
|---|---|---|
| W04 | Employee home | ✅ |
| W07 | Report a problem | ✅ |
| W08 | My tickets and status | ✅ |
| W14 | Request a gate pass | ✅ |

### IT Admin & Technicians
| ID | Page | Status |
|---|---|---|
| W03 | Home dashboard | ✅ |
| W05 | Tickets queue and detail | ✅ |
| W09 | Devices, hover to turn | ✅ |
| W10 | Device 3D viewer | ✅ |
| W11 | Register a device | ✅ |
| W12 | 3D model library | ✅ |
| W13 | Gate pass approvals | ✅ |
| W25 | Stock and licences | ✅ |
| W26 | Audit trail | ✅ |
| W15 | Reports | ✅ |
| W16 | People and roles | ✅ |
| W17 | Categories and SLA targets | ✅ |
| W24 | Resolve / reassign / retire dialogs (popup) | 🔲 |

---

## Contributing

1. Branch off `main` — use `feat/`, `fix/`, or `chore/` prefixes.
2. Keep each page or component in one commit with a clear message.
3. Run `npm test`, `npm run lint`, and `npm run build` before opening a PR — all must pass.
4. Follow [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md) when replacing the demo data sources with asynchronous API services.
