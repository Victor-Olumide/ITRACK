# ITrack

A desktop-class IT support ticket and asset management web app built for internal IT teams. Manage helpdesk tickets, track hardware assets, run gate-pass approvals, and monitor SLA performance — all from a single interface.

> **Status:** Active development · 5 of 25 screens designed

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

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Project structure

```
src/
├── App.jsx                  # Route definitions
├── main.jsx                 # React entry point
├── index.css                # Tailwind import
│
├── lib/
│   └── mockData.js          # Relational dummy data (users, tickets,
│                            # devices, gate passes, stock, gate log)
│
├── components/
│   ├── Layout.jsx           # App shell: Sidebar + Topbar + <Outlet />
│   ├── Sidebar.jsx          # Dark navy nav with live badge counts
│   ├── Topbar.jsx           # Search bar, notifications, user avatar
│   ├── Badge.jsx            # Status / priority pills (auto-toned)
│   └── AssetTag.jsx         # Lime-green device tag (e.g. IT-LAP-0042)
│
└── pages/
    ├── Auth.jsx             # Sign in / sign up (full-screen, no shell)
    ├── Home.jsx             # Dashboard — KPIs, SLA, ticket queue
    ├── Tickets.jsx          # Split-pane: queue list + ticket detail
    ├── Devices.jsx          # Grid/list asset view with status filters
    ├── DeviceDetailPage.jsx # 3D viewer + device info tabs
    ├── RegisterDevice.jsx   # Register a new device (form + 3D model pick)
    ├── GatePasses.jsx       # Approvals list + inline review modal
    ├── GateStation.jsx      # Kiosk: scan items in/out + gate log
    ├── Stock.jsx            # Accessories / consumables table
    ├── Reports.jsx          # SLA and ticket category charts
    ├── Settings.jsx         # Signature, notifications, start-up prefs
    └── NotFound.jsx         # 404 page
```

---

## Mock data

All UI is driven by `src/lib/mockData.js` — no backend required during development. The file exports relational arrays whose IDs cross-reference each other:

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
| W01 | Sign in | 🔲 |
| W02 | Reset password | 🔲 |
| W18 | Notifications | 🔲 |
| W19 | Profile and preferences | 🔲 |
| W20 | No access / not found / offline | 🔲 |
| W21 | Empty states | 🔲 |
| W22 | Session expired (popup) | 🔲 |
| W23 | Toasts (popup) | 🔲 |

### Employees
| ID | Page | Status |
|---|---|---|
| W04 | Employee home | 🔲 |
| W07 | Report a problem | 🔲 |
| W08 | My tickets and status | 🔲 |
| W14 | Request a gate pass | 🔲 |

### IT Admin & Technicians
| ID | Page | Status |
|---|---|---|
| W03 | Home dashboard | ✅ |
| W05 | Tickets queue and detail | ✅ |
| W09 | Devices, hover to turn | ✅ |
| W10 | Device 3D viewer | ✅ |
| W11 | Register a device | ✅ |
| W12 | 3D model library | 🔲 |
| W13 | Gate pass approvals | 🔲 |
| W25 | Stock and licences | 🔲 |
| W26 | Audit trail | 🔲 |
| W15 | Reports | 🔲 |
| W16 | People and roles | 🔲 |
| W17 | Categories and SLA targets | 🔲 |
| W24 | Resolve / reassign / retire dialogs (popup) | 🔲 |

---

## Contributing

1. Branch off `main` — use `feat/`, `fix/`, or `chore/` prefixes.
2. Keep each page or component in one commit with a clear message.
3. Run `npm run lint` and `npm run build` before opening a PR — both must pass with zero errors.
4. Swap `src/lib/mockData.js` exports for real API calls when the backend is ready; page components should need no other changes.
