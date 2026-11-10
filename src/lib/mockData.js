// src/lib/mockData.js
// Rich, relational dummy data for ITrack — IT support ticket & asset management.
//
// IDs cross-reference across collections so you can resolve any entity:
//   tickets.requesterId / tickets.assigneeId  -> users.id
//   tickets.deviceId                          -> devices.id
//   devices.assigneeId                        -> users.id
//   gatePasses.requesterId                    -> users.id
//   gatePasses.items[].tag                    -> devices.tag (where tracked)
//   gateLog.deviceId                          -> devices.id
//   gateLog.personId / gateLog.loggedById     -> users.id
//   gateLog.passId                            -> gatePasses.id
//
// Swap this file for real API calls later — the shape mirrors what a
// REST/GraphQL backend would return. The `*ById` / `*ByTag` lookups at the
// bottom are the only helpers pages should need.

// ── Roles ──────────────────────────────────────────────────────
export const ROLES = [
  { value: 'IT Admin',   label: 'IT Admin' },
  { value: 'Technician', label: 'Technician' },
  { value: 'Employee',   label: 'Employee' },
  { value: 'Security',   label: 'Security' },
]

// ── Users (covers all four roles) ──────────────────────────────
// Fields: id, name, role, department, staffId
const seedUsers = [
  { id: 'u01', name: 'Ngozi Eze',      role: 'IT Admin',   department: 'IT',          staffId: 'IT-A-001' },
  { id: 'u02', name: 'Tunde Adeyemi',  role: 'Technician', department: 'IT',          staffId: 'IT-T-014' },
  { id: 'u03', name: 'Ifeanyi Okafor', role: 'Technician', department: 'IT',          staffId: 'IT-T-021' },
  { id: 'u04', name: 'Kemi Sodipo',    role: 'Technician', department: 'IT',          staffId: 'IT-T-008' },
  { id: 'u05', name: 'Bola Kadri',     role: 'Employee',   department: 'Finance',     staffId: 'FIN-0112' },
  { id: 'u06', name: 'Yusuf Bello',    role: 'Employee',   department: 'Operations',  staffId: 'OPS-0067' },
  { id: 'u07', name: 'Amaka Obi',      role: 'Employee',   department: 'Finance',     staffId: 'FIN-0098' },
  { id: 'u08', name: 'Chidi Nwafor',   role: 'Employee',   department: 'HR',          staffId: 'HR-0033' },
  { id: 'u09', name: 'Sani Musa',      role: 'Security',   department: 'Security',    staffId: 'SEC-0002' },
  { id: 'u10', name: 'Sade Bello',     role: 'Technician', department: 'IT',          staffId: 'IT-T-031' },
]

export const users = seedUsers.map((user) => ({
  ...user,
  email: `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@abuad.edu.ng`,
}))

// ── Devices ────────────────────────────────────────────────────
// Fields: id, tag, category, make, model, serialNumber, status,
//         assigneeId, location, ipAddress, warrantyEnds
// category: Laptops | Desktops | Phones | Monitors
// status:   Assigned | In store | Off-site | In repair | Retired
export const devices = [
  { id: 'd01', tag: 'IT-LAP-0042', category: 'Laptops',   make: 'Dell',    model: 'Latitude 5440',      serialNumber: 'DLLA5440X42',  status: 'Assigned',  assigneeId: 'u05', location: 'Finance · HQ 2nd floor',    ipAddress: '10.0.12.42', warrantyEnds: '2027-03-15' },
  { id: 'd02', tag: 'IT-LAP-0043', category: 'Laptops',   make: 'HP',      model: 'EliteBook 840 G11',  serialNumber: 'HPEB840G11Y',  status: 'Assigned',  assigneeId: 'u06', location: 'Operations · HQ 1st floor', ipAddress: '10.0.12.43', warrantyEnds: '2027-06-20' },
  { id: 'd03', tag: 'IT-DSK-0017', category: 'Desktops',  make: 'Lenovo',  model: 'ThinkCentre M75q',   serialNumber: 'LNM75Q017',    status: 'Assigned',  assigneeId: 'u05', location: 'Finance · HQ 2nd floor',    ipAddress: '10.0.12.17', warrantyEnds: '2026-12-01' },
  { id: 'd04', tag: 'IT-DSK-0018', category: 'Desktops',  make: 'Dell',    model: 'OptiPlex 7020',      serialNumber: 'DLOP702018',   status: 'Assigned',  assigneeId: 'u08', location: 'HR · HQ 2nd floor',         ipAddress: '10.0.12.18', warrantyEnds: '2026-06-30' },
  { id: 'd05', tag: 'IT-MON-0031', category: 'Monitors',  make: 'Dell',    model: 'U2723QE 27"',        serialNumber: 'DLU2723Q31',   status: 'Assigned',  assigneeId: 'u05', location: 'Finance · HQ 2nd floor',    ipAddress: null,         warrantyEnds: '2028-01-15' },
  { id: 'd06', tag: 'IT-MON-0032', category: 'Monitors',  make: 'LG',      model: '24MK600',            serialNumber: 'LG24MK60032',  status: 'In store',  assigneeId: null,  location: 'IT storeroom',              ipAddress: null,         warrantyEnds: '2027-09-20' },
  { id: 'd07', tag: 'IT-LAP-0044', category: 'Laptops',   make: 'Apple',   model: 'MacBook Air M3',     serialNumber: 'APMBAM344',    status: 'Assigned',  assigneeId: 'u01', location: 'IT · HQ 3rd floor',         ipAddress: '10.0.12.44', warrantyEnds: '2027-06-01' },
  { id: 'd08', tag: 'IT-LAP-0045', category: 'Laptops',   make: 'Lenovo',  model: 'ThinkPad X1 Carbon', serialNumber: 'LNX1C045',     status: 'In repair', assigneeId: null,  location: 'IT workshop',              ipAddress: '10.0.12.45', warrantyEnds: '2026-02-28' },
  { id: 'd09', tag: 'IT-DSK-0019', category: 'Desktops',  make: 'HP',      model: 'EliteDesk 800',      serialNumber: 'HED800019',    status: 'Retired',   assigneeId: null,  location: 'IT storeroom',              ipAddress: null,         warrantyEnds: '2025-04-30' },
  { id: 'd10', tag: 'IT-MON-0033', category: 'Monitors',  make: 'BenQ',    model: 'GW2480',             serialNumber: 'BQGW248033',   status: 'Assigned',  assigneeId: 'u06', location: 'Operations · HQ 1st floor', ipAddress: null,         warrantyEnds: '2026-10-25' },
  { id: 'd11', tag: 'IT-LAP-0046', category: 'Laptops',   make: 'Dell',    model: 'XPS 15',             serialNumber: 'DLXPS15046',   status: 'Assigned',  assigneeId: 'u02', location: 'IT · HQ 3rd floor',         ipAddress: '10.0.12.46', warrantyEnds: '2028-03-18' },
  { id: 'd12', tag: 'IT-PHN-0012', category: 'Phones',    make: 'Samsung', model: 'Galaxy A54',        serialNumber: 'SGA54X012',    status: 'Assigned',  assigneeId: 'u09', location: 'Security · Gate A',        ipAddress: null,         warrantyEnds: '2027-04-10' },
  { id: 'd13', tag: 'IT-PHN-0013', category: 'Phones',    make: 'Apple',   model: 'iPhone 15',         serialNumber: 'IP150013',     status: 'Assigned',  assigneeId: 'u06', location: 'Operations · HQ 1st floor', ipAddress: null,         warrantyEnds: '2027-02-05' },
  { id: 'd14', tag: 'IT-DSK-0020', category: 'Desktops',  make: 'Dell',    model: 'OptiPlex 7020',      serialNumber: 'DLOP702020',   status: 'In store',  assigneeId: null,  location: 'IT storeroom',              ipAddress: '10.0.12.20', warrantyEnds: '2027-01-30' },
  { id: 'd15', tag: 'IT-LAP-0047', category: 'Laptops',   make: 'HP',      model: 'ProBook 450',        serialNumber: 'HPPB45047',    status: 'Off-site',  assigneeId: 'u07', location: 'Finance (field) · GP-0029', ipAddress: '10.0.12.47', warrantyEnds: '2026-11-30' },
  { id: 'd16', tag: 'IT-MON-0034', category: 'Monitors',  make: 'Dell',    model: 'P2422H',             serialNumber: 'DLP2422H034',  status: 'In store',  assigneeId: null,  location: 'IT storeroom',              ipAddress: null,         warrantyEnds: '2027-12-15' },
]

// ── Tickets ────────────────────────────────────────────────────
// Fields: id, title, type, priority, status, timeState,
//         assigneeId, requesterId, deviceId, history
// type:      Problem | Request
// priority:  Critical | High | Medium | Low
// status:    Unassigned | In progress | Waiting on user | Resolved
// timeState: Breached | At risk | On track | Paused
//
// `category`, `description`, `response`, `resolution` and `sla` are extra
// UI convenience fields kept alongside the relational IDs.
export const tickets = [
  {
    id: 'IT-0181', title: 'PC switches off during work', type: 'Problem', category: 'PC hardware',
    priority: 'Critical', status: 'In progress', timeState: 'Breached',
    assigneeId: 'u02', requesterId: 'u05', deviceId: 'd03',
    description: 'The PC turns itself off two or three times a day, usually after lunch. It started on Monday. I lose whatever I was typing.',
    response: 'Met in 22 min of 1h', resolution: 'Breached 1h 20m', sla: 'Breached 1h 20m',
    history: [
      { time: '09:05', text: 'Bola K. submitted the ticket' },
      { time: '09:27', text: 'Tunde A. took it · response met' },
      { time: '09:40', text: 'Status changed to In progress' },
      { time: '10:15', text: 'Internal note: power supply overheating, spare is in the store', note: true },
    ],
  },
  {
    id: 'IT-0190', title: 'Wi-Fi keeps dropping on the 2nd floor', type: 'Problem', category: 'Network',
    priority: 'Critical', status: 'Unassigned', timeState: 'At risk',
    assigneeId: null, requesterId: 'u06', deviceId: null,
    description: 'The Wi-Fi connection keeps disconnecting on the second floor.',
    response: 'Pending', resolution: '52m left', sla: 'At risk · 52m left',
    history: [],
  },
  {
    id: 'IT-0169', title: 'Need a new mouse', type: 'Request', category: 'Accessories',
    priority: 'Low', status: 'Unassigned', timeState: 'At risk',
    assigneeId: null, requesterId: 'u06', deviceId: null,
    description: 'I need a replacement mouse for my workstation.',
    response: 'Pending', resolution: '5h left', sla: 'At risk · 5h left',
    history: [],
  },
  {
    id: 'IT-0187', title: 'Printer keeps showing a paper jam', type: 'Problem', category: 'Printer',
    priority: 'Medium', status: 'In progress', timeState: 'On track',
    assigneeId: 'u03', requesterId: 'u07', deviceId: null,
    description: 'The office printer keeps displaying a paper jam error.',
    response: 'Pending', resolution: '7h 40m left', sla: '7h 40m left',
    history: [
      { time: '14:00', text: 'Amaka O. submitted the ticket' },
      { time: '14:20', text: 'Ifeanyi O. took it' },
    ],
  },
  {
    id: 'IT-0175', title: 'Fan very loud on desktop', type: 'Problem', category: 'PC hardware',
    priority: 'Low', status: 'Unassigned', timeState: 'On track',
    assigneeId: null, requesterId: 'u08', deviceId: 'd04',
    description: 'The desktop fan makes a loud noise whenever the computer is running.',
    response: 'Pending', resolution: '20h left', sla: '20h left',
    history: [
      { time: '10:00', text: 'Chidi N. submitted the ticket' },
    ],
  },
  {
    id: 'IT-0184', title: 'Outlook asks for my password every hour', type: 'Problem', category: 'Accounts',
    priority: 'Medium', status: 'Waiting on user', timeState: 'Paused',
    assigneeId: 'u03', requesterId: 'u09', deviceId: null,
    description: 'Outlook repeatedly asks me to enter my password.',
    response: 'Met', resolution: 'Paused', sla: 'Paused · waiting on user',
    history: [
      { time: '11:00', text: 'Musa I. submitted the ticket' },
      { time: '11:25', text: 'Ifeanyi O. took it · response met' },
      { time: '12:10', text: 'Waiting on user to restart Outlook' },
    ],
  },
  {
    id: 'IT-0152', title: 'Laptop freezing under load', type: 'Problem', category: 'PC hardware',
    priority: 'High', status: 'Waiting on user', timeState: 'At risk',
    assigneeId: 'u03', requesterId: 'u06', deviceId: 'd02',
    description: 'EliteBook hangs for ~10s when opening large spreadsheets.',
    response: 'Met', resolution: 'At risk · 3h left', sla: 'At risk · 3h left',
    history: [
      { time: '09:00', text: 'Yusuf B. submitted the ticket' },
      { time: '09:30', text: 'Ifeanyi O. took it' },
      { time: '10:00', text: 'Asked Yusuf to drop the laptop off for testing' },
    ],
  },
  {
    id: 'IT-0163', title: 'USB-C charger not working', type: 'Problem', category: 'Accessories',
    priority: 'Low', status: 'Resolved', timeState: 'On track',
    assigneeId: 'u04', requesterId: 'u07', deviceId: null,
    description: 'Anker charger no longer powers the laptop. Tried two cables.',
    response: 'Met', resolution: 'Resolved', sla: 'Resolved', resolutionHours: 1,
    history: [
      { time: '10:00', text: 'Amaka O. submitted the ticket' },
      { time: '10:20', text: 'Kemi S. took it' },
      { time: '11:00', text: 'Replaced the charger · resolved' },
    ],
  },
  {
    id: 'IT-0182', title: 'MacBook screen flickering', type: 'Problem', category: 'PC hardware',
    priority: 'High', status: 'In progress', timeState: 'At risk',
    assigneeId: 'u01', requesterId: 'u01', deviceId: 'd07',
    description: 'Display flickers when brightness is above 60%. Started this morning.',
    response: 'Met in 15 min', resolution: 'At risk · 2h left', sla: 'At risk · 2h left',
    history: [
      { time: '08:00', text: 'Ngozi E. submitted the ticket' },
      { time: '08:15', text: 'Ngozi E. took it' },
    ],
  },
  {
    id: 'IT-0188', title: 'Monitor has dead pixels', type: 'Problem', category: 'PC hardware',
    priority: 'Critical', status: 'In progress', timeState: 'At risk',
    assigneeId: 'u02', requesterId: 'u06', deviceId: 'd10',
    description: 'BenQ GW2480 has a cluster of dead pixels near the centre.',
    response: 'Met in 40 min', resolution: 'At risk · 1h left', sla: 'At risk · 1h left',
    history: [
      { time: '07:30', text: 'Yusuf B. submitted the ticket' },
      { time: '08:10', text: 'Tunde A. took it' },
    ],
  },
]

// ── Gate Passes ─────────────────────────────────────────────────
// Fields: id, requesterId, destination, outDate, returnDate, status, items
// status: Waiting | Approved | Overdue
// items: [{ tag, make, serial, condition }]
export const gatePasses = [
  {
    id: 'GP-0034', requesterId: 'u06', destination: 'Client office, Ring Road, Ibadan',
    outDate: '2026-11-10', returnDate: '2026-11-14', status: 'Waiting',
    items: [
      { tag: 'IT-LAP-0042', make: 'Dell Latitude 5440',        serial: 'DLLA5440X42',  condition: 'Good, small scuff on lid' },
      { tag: 'IT-ACC-041',  make: 'Dell 65W USB-C charger',   serial: 'CN-0M0RT-47A', condition: 'Good' },
      { tag: 'IT-ACC-042',  make: 'C5 cloverleaf cable 1.8m', serial: 'None printed', condition: 'Good' },
      { tag: 'IT-ACC-043',  make: 'Logitech M185 mouse',      serial: '2219LZ04K8',   condition: 'Good' },
      { tag: 'IT-ACC-044',  make: 'Targus 15.6" bag',          serial: 'None printed', condition: 'Worn strap' },
    ],
  },
  {
    id: 'GP-0031', requesterId: 'u01', destination: 'Off-site audit, Lagos',
    outDate: '2026-11-07', returnDate: '2026-11-09', status: 'Approved',
    items: [
      { tag: 'IT-LAP-0044', make: 'Apple MacBook Air M3', serial: 'APMBAM344', condition: 'Good' },
    ],
  },
  {
    id: 'GP-0029', requesterId: 'u07', destination: 'Home charging setup',
    outDate: '2026-11-03', returnDate: '2026-11-06', status: 'Overdue',
    items: [
      { tag: 'IT-LAP-0047', make: 'HP ProBook 450', serial: 'HPPB45047', condition: 'Good' },
    ],
  },
  {
    id: 'GP-0033', requesterId: 'u06', destination: 'Field office setup',
    outDate: '2026-11-12', returnDate: '2026-11-15', status: 'Waiting',
    items: [
      { tag: 'IT-MON-0033', make: 'BenQ GW2480', serial: 'BQGW248033', condition: 'Good' },
    ],
  },
  {
    id: 'GP-0027', requesterId: 'u02', destination: 'On-call weekend coverage',
    outDate: '2026-10-28', returnDate: '2026-10-30', status: 'Approved',
    items: [
      { tag: 'IT-LAP-0046', make: 'Dell XPS 15', serial: 'DLXPS15046', condition: 'Good' },
    ],
  },
  {
    id: 'GP-0030', requesterId: 'u04', destination: 'Repair vendor pickup',
    outDate: '2026-11-01', returnDate: '2026-11-05', status: 'Approved',
    items: [
      { tag: 'IT-LAP-0045', make: 'Lenovo ThinkPad X1 Carbon', serial: 'LNX1C045', condition: 'Cracked hinge' },
    ],
  },
]

// ── Stock (accessories / consumables) ──────────────────────────
// Fields: id, name, make, category, inStock, total, location, serials
// category: Mouse | Keyboard | Cable
export const stock = [
  { id: 'STK-001', name: 'Wireless Mouse',  make: 'Logitech', category: 'Mouse',   inStock: 12, total: 20, location: 'IT storeroom', serials: ['LM185-0001', 'LM185-0002', 'LM185-0003', 'LM185-0004', 'LM185-0005'] },
  { id: 'STK-002', name: 'Mechanical Keyboard', make: 'Keychron', category: 'Keyboard', inStock: 4, total: 6, location: 'IT storeroom', serials: ['KC-K8-001', 'KC-K8-002', 'KC-K8-003', 'KC-K8-004'] },
  { id: 'STK-003', name: 'USB-C Cable 1m', make: 'Anker',   category: 'Cable',    inStock: 18, total: 24, location: 'IT storeroom', serials: ['AK-USBC-01', 'AK-USBC-02', 'AK-USBC-03', 'AK-USBC-04', 'AK-USBC-05', 'AK-USBC-06'] },
  { id: 'STK-004', name: 'HDMI Cable 2m', make: 'Ugreen',  category: 'Cable',    inStock: 9,  total: 15, location: 'IT storeroom', serials: ['UG-HDMI-01', 'UG-HDMI-02', 'UG-HDMI-03', 'UG-HDMI-04'] },
  { id: 'STK-005', name: 'Wireless Mouse', make: 'Dell',   category: 'Mouse',    inStock: 7,  total: 10, location: 'IT storeroom', serials: ['DM-MS-01', 'DM-MS-02', 'DM-MS-03', 'DM-MS-04', 'DM-MS-05'] },
  { id: 'STK-006', name: 'USB Keyboard', make: 'Dell',     category: 'Keyboard', inStock: 11, total: 12, location: 'IT storeroom', serials: ['DK-KB-01', 'DK-KB-02', 'DK-KB-03', 'DK-KB-04', 'DK-KB-05'] },
  { id: 'STK-007', name: 'Power Cable C5', make: 'C2G',   category: 'Cable',    inStock: 6,  total: 8,  location: 'IT storeroom', serials: ['C2G-C5-01', 'C2G-C5-02', 'C2G-C5-03', 'C2G-C5-04'] },
]

// ── Gate Log ────────────────────────────────────────────────────
// Fields: id, time, event, deviceId, personId, gate, passId, loggedById
// event: Out | Back | Stopped
export const gateLog = [
  { id: 'GL-001', time: '2026-11-07 08:42', event: 'Out',     deviceId: 'd07', personId: 'u01', gate: 'Gate A', passId: 'GP-0031', loggedById: 'u09' },
  { id: 'GL-002', time: '2026-11-07 17:55', event: 'Back',    deviceId: 'd07', personId: 'u01', gate: 'Gate A', passId: 'GP-0031', loggedById: 'u09' },
  { id: 'GL-003', time: '2026-11-03 09:10', event: 'Out',     deviceId: 'd15', personId: 'u07', gate: 'Gate B', passId: 'GP-0029', loggedById: 'u09' },
  { id: 'GL-004', time: '2026-11-06 18:00', event: 'Stopped', deviceId: 'd15', personId: 'u07', gate: 'Gate B', passId: 'GP-0029', loggedById: 'u09' },
  { id: 'GL-005', time: '2026-10-28 16:30', event: 'Out',     deviceId: 'd11', personId: 'u02', gate: 'Gate A', passId: 'GP-0027', loggedById: 'u09' },
  { id: 'GL-006', time: '2026-10-30 09:00', event: 'Back',    deviceId: 'd11', personId: 'u02', gate: 'Gate A', passId: 'GP-0027', loggedById: 'u09' },
  { id: 'GL-007', time: '2026-11-01 10:15', event: 'Out',     deviceId: 'd08', personId: 'u04', gate: 'Gate B', passId: 'GP-0030', loggedById: 'u09' },
  { id: 'GL-008', time: '2026-11-05 14:20', event: 'Back',    deviceId: 'd08', personId: 'u04', gate: 'Gate B', passId: 'GP-0030', loggedById: 'u09' },
]

// Dashboard summaries are derived from the same records used by the pages.
const activeTickets = tickets.filter((ticket) => ticket.status !== 'Resolved')
const deviceStatuses = ['Assigned', 'In store', 'Off-site', 'In repair', 'Retired']
const deviceCounts = Object.fromEntries(
  deviceStatuses.map((status) => [status, devices.filter((device) => device.status === status).length]),
)
const now = new Date()
const warrantyCutoff = new Date(now)
warrantyCutoff.setDate(warrantyCutoff.getDate() + 30)
const resolvedDurations = tickets
  .filter((ticket) => ticket.status === 'Resolved' && Number.isFinite(ticket.resolutionHours))
  .map((ticket) => ticket.resolutionHours)
const onTrackCount = tickets.filter((ticket) => ticket.timeState === 'On track').length

export const metrics = {
  openTickets: activeTickets.length,
  unassignedTickets: activeTickets.filter((ticket) => !ticket.assigneeId).length,
  avgResolutionHours: resolvedDurations.length
    ? Math.round(resolvedDurations.reduce((sum, hours) => sum + hours, 0) / resolvedDurations.length * 10) / 10
    : null,
  slaMetPercentage: tickets.length ? Math.round(onTrackCount / tickets.length * 100) : 0,
  slaTargetPercentage: 90,
  devicesTotal: devices.length,
  devicesAssigned: deviceCounts.Assigned,
  devicesInStore: deviceCounts['In store'],
  devicesOffSite: deviceCounts['Off-site'],
  devicesInRepair: deviceCounts['In repair'],
  devicesRetired: deviceCounts.Retired,
  warrantiesEnding: devices.filter((device) => {
    const warrantyDate = new Date(device.warrantyEnds)
    return warrantyDate >= now && warrantyDate <= warrantyCutoff
  }).length,
  gatePassesWaiting: gatePasses.filter((pass) => pass.status === 'Waiting').length,
  gatePassesOverdue: gatePasses.filter((pass) => pass.status === 'Overdue').length,
}

const categoryColors = ['#254BFE', '#ADD900', '#8159FF', '#FF6E2F', '#00A9A6', '#0B184C']
const categoryCounts = new Map()
tickets.forEach((ticket) => categoryCounts.set(ticket.category, (categoryCounts.get(ticket.category) ?? 0) + 1))
export const ticketsByCategory = [...categoryCounts]
  .map(([label, value], index) => ({ label, value, color: categoryColors[index % categoryColors.length] }))
  .sort((a, b) => b.value - a.value)

const breachedTickets = activeTickets.filter((ticket) => ticket.timeState === 'Breached')
const waitingPasses = gatePasses.filter((pass) => pass.status === 'Waiting')
const repairDevices = devices.filter((device) => device.status === 'In repair')
export const needsAction = [
  ...(breachedTickets.length ? [{
    color: 'bg-red-100 text-red-600',
    num: '!',
    title: `${breachedTickets.length} ticket${breachedTickets.length === 1 ? '' : 's'} breached the target`,
    desc: `${breachedTickets[0].id} · ${breachedTickets[0].title}`,
    link: 'Open ticket',
    href: `/tickets?ticket=${breachedTickets[0].id}`,
  }] : []),
  ...(waitingPasses.length ? [{
    color: 'bg-gray-100 text-gray-500',
    num: '?',
    title: `${waitingPasses.length} gate pass${waitingPasses.length === 1 ? '' : 'es'} waiting`,
    desc: 'Devices can only leave once you approve them.',
    link: 'Review passes',
  }] : []),
  ...(metrics.warrantiesEnding ? [{
    color: 'bg-yellow-100 text-yellow-600',
    num: '!',
    title: `${metrics.warrantiesEnding} warranties ending soon`,
    desc: 'Renew or claim before cover runs out.',
    link: 'View devices',
  }] : []),
  ...(repairDevices.length ? [{
    color: 'bg-blue-100 text-blue-600',
    num: 'i',
    title: `${repairDevices.length} device${repairDevices.length === 1 ? '' : 's'} in repair`,
    desc: 'Review equipment currently in the workshop.',
    link: 'View repairs',
  }] : []),
]

const timeStateColors = {
  Breached: 'bg-red-50 text-red-600 border border-red-200',
  'At risk': 'bg-orange-50 text-orange-600 border border-orange-200',
  'On track': 'bg-green-50 text-green-700 border border-green-200',
  Paused: 'bg-gray-100 text-gray-600 border border-gray-200',
}
export const todayQueue = activeTickets.slice(0, 4).map((ticket) => {
  const requester = users.find((user) => user.id === ticket.requesterId)
  return {
    title: ticket.title,
    id: ticket.id,
    cat: ticket.category,
    user: requester
      ? `${requester.name.split(' ')[0]} ${requester.name.split(' ')[1]?.[0] ?? ''}.`
      : 'Unknown',
    dept: requester?.department ?? '—',
    badge: ticket.sla,
    badgeColor: timeStateColors[ticket.timeState] ?? timeStateColors.Paused,
  }
})

const technicianRecords = users.filter((user) => user.role === 'Technician').map((technician) => {
  const assigned = activeTickets.filter((ticket) => ticket.assigneeId === technician.id)
  const atRisk = assigned.filter((ticket) => ticket.timeState === 'At risk').length
  const breached = assigned.filter((ticket) => ticket.timeState === 'Breached').length
  return {
    initials: technician.name.split(' ').map((part) => part[0]).join('').slice(0, 2),
    name: technician.name,
    sub: breached ? `${breached} breached` : atRisk ? `${atRisk} at risk` : '',
    tickets: assigned.length,
  }
})
const workloadMax = Math.max(1, ...technicianRecords.map(({ tickets: count }) => count))
export const technicianWorkload = technicianRecords.map((technician, index) => ({
  ...technician,
  barColor: ['bg-orange-500', 'bg-blue-600', 'bg-blue-600', 'bg-blue-600'][index % 4],
  max: workloadMax,
}))

const deviceStatusColors = {
  Assigned: 'bg-blue-600',
  'In store': 'bg-[#CCFF00]',
  'Off-site': 'bg-violet-500',
  'In repair': 'bg-orange-500',
  Retired: 'bg-gray-400',
}
export const deviceRegisterSegments = deviceStatuses.map((status) => ({
  pct: metrics.devicesTotal ? deviceCounts[status] / metrics.devicesTotal * 100 : 0,
  color: deviceStatusColors[status],
}))

// ── Lookups ─────────────────────────────────────────────────────
export const userById        = (id)  => users.find((u) => u.id === id)
export const deviceById      = (id)  => devices.find((d) => d.id === id)
export const deviceByTag      = (tag) => devices.find((d) => d.tag === tag)
export const ticketById       = (id)  => tickets.find((t) => t.id === id)
export const gatePassById     = (id)  => gatePasses.find((g) => g.id === id)
export const stockById        = (id)  => stock.find((s) => s.id === id)
export const usersByRole      = (role) => users.filter((u) => u.role === role)
export const gateLogByDevice  = (id)  => gateLog.filter((g) => g.deviceId === id)
export const gateLogByPass    = (id)  => gateLog.filter((g) => g.passId === id)

// Short display name, e.g. "Ngozi E." — used across the UI.
export const shortName = (name = '') => {
  const [first = '', last = ''] = name.split(' ')
  return last ? `${first} ${last[0]}.` : first
}

// ── Device model catalogue (used by the register-device form) ──
export const deviceModels = [
  { id: 'm01', name: 'Dell Latitude 5440', count: 12 },
  { id: 'm02', name: 'Dell P2422H',         count: 31 },
  { id: 'm03', name: 'HP LaserJet M404',   count: 6  },
  { id: 'm04', name: 'Dell OptiPlex 7010', count: 18 },
  { id: 'm05', name: 'Samsung Galaxy A54', count: 9  },
]
