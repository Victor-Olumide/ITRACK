export type UserRole = 'IT Admin' | 'Technician' | 'Employee' | 'Security'
export type DeviceStatus = 'Assigned' | 'In store' | 'Off-site' | 'In repair' | 'Retired'
export type TicketStatus = 'Unassigned' | 'Assigned' | 'In progress' | 'Waiting on user' | 'Resolved' | 'Closed'
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Legacy'
export type TicketTimeState = 'Breached' | 'Not overdue'
export type GatePassStatus = 'Waiting' | 'Approved' | 'Rejected' | 'Overdue'
export type GateEventType = 'Out' | 'Back' | 'Stopped'

export interface RoleOption {
  value: UserRole
  label: string
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  staffId: string
  phone?: string
}

export interface Account extends PublicUser {
  password: string
}

export interface Device {
  id: string
  tag: string
  category: string
  make: string
  model: string
  serialNumber: string
  status: DeviceStatus
  assigneeId: string | null
  location: string
  ipAddress: string | null
  warrantyEnds: string
}

export interface TicketHistoryEntry {
  time: string
  text: string
  note?: boolean
}

export interface Ticket {
  id: string
  serverId?: string
  title: string
  type: 'Problem' | 'Request'
  category: string
  priority: TicketPriority
  status: TicketStatus
  timeState: TicketTimeState
  assigneeId: string | null
  requesterId: string
  requesterName?: string
  requesterDepartment?: string
  assigneeName?: string | null
  deviceId: string | null
  deviceName?: string | null
  description: string
  response: string
  resolution: string
  sla: string
  resolutionHours?: number
  deviceTag?: string | null
  createdAt?: string
  history: TicketHistoryEntry[]
}

export interface GatePassItem {
  tag: string
  make?: string
  serial?: string
  condition?: string
  name?: string
  type?: string
  qty?: number
}

export interface GatePass {
  id: string
  serverId?: string
  requesterId: string
  destination: string
  outDate: string
  returnDate: string
  status: GatePassStatus
  items: GatePassItem[]
  purpose?: string
  isReturnable?: boolean
  issuedById?: string
}

export interface StockItem {
  id: string
  name: string
  make: string
  category: string
  inStock: number
  total: number
  location: string
  serials: string[]
}

export interface GateLogEntry {
  id: string
  time: string
  event: GateEventType
  deviceId: string | null
  personId: string
  gate: string
  passId: string
  loggedById: string
  occurredAt?: number
  assetTag?: string
  itemName?: string
}

export interface DeviceModel {
  id: string
  name: string
  count: number
}
