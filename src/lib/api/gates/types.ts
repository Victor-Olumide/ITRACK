// Server contracts for /gate-passes (itrack-server src/gates).

export type GatePassStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ISSUED'
  | 'EXITED'
  | 'RETURNED'
  | 'EXPIRED'

export type GatePassItemClass = 'ASSET' | 'ACCESSORY'

export interface GatePassPerson {
  id: string
  fullName: string
  staffId: string
  email: string
  phone: string | null
  role: string
  department: { name: string }
}

export interface GatePassItem {
  id: string
  itemClass: GatePassItemClass
  name: string
  assetTag: string | null
  makeModel: string | null
  serialNumber: string | null
  quantity: number
  conditionOut: string | null
  seenAtExit: boolean
  returnedAt: string | null
  conditionIn: string | null
}

export interface GatePass {
  id: string
  code: string
  number: number
  status: GatePassStatus
  overdue: boolean
  isReturnable: boolean
  reason: string
  destination: string
  leavesOn: string | null
  expectedReturnAt: string | null
  contactPhone: string | null
  reviewNote: string | null
  returnNote: string | null
  exitGate: string | null
  createdAt: string
  approvedAt: string | null
  receiverSignedAt: string | null
  exitedAt: string | null
  returnedAt: string | null
  asset: { id: string; assetTag: string; make: string; model: string; type: string; serialNumber: string }
  requester: GatePassPerson
  reviewer: GatePassPerson | null
  handedOverBy: GatePassPerson | null
  exitedBy: GatePassPerson | null
  returnedBy: GatePassPerson | null
  // `image` is only filled on the single-pass endpoint, not the list.
  issuerSignature: { sha256: string; signedAt: string; image: string | null } | null
  receiverSignature: { signedAt: string; image: string | null } | null
  items: GatePassItem[]
}

export interface MyGateAsset {
  id: string
  assetTag: string
  make: string
  model: string
  type: string
  serialNumber: string
  condition: string
  openPass: string | null
}

export interface GateAssetLookup {
  id: string
  assetTag: string
  make: string
  model: string
  type: string
  serialNumber: string
  condition: string
  assignedTo: { fullName: string; department: { name: string } } | null
}

export interface CreateGatePassRequest {
  assetIds: string[]
  reason: string
  destination: string
  leavesOn: string
  expectedReturnAt?: string | null
  contactPhone?: string | null
  isReturnable: boolean
}

export interface GatePassItemInput {
  itemClass: GatePassItemClass
  assetTag?: string | null
  name: string
  makeModel?: string | null
  serialNumber?: string | null
  quantity: number
  conditionOut?: string | null
}

export interface ReviewGatePassRequest {
  id: string
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string
  pin?: string
  isReturnable?: boolean
  reason?: string
  destination?: string
  leavesOn?: string
  expectedReturnAt?: string | null
  items?: GatePassItemInput[]
}

export interface HandoverGatePassRequest {
  id: string
  signature?: string
  useSavedSignature?: boolean
  pin?: string
}

export type GateCheckResult =
  | { result: 'CLEARED' | 'RETURNING'; tag: string; reason: null; asset: null; pass: GatePass }
  | { result: 'NOT_CLEARED'; tag: string; reason: string; asset: GateAssetLookup | null; pass: GatePass | null }

export interface GateEvent {
  id: string
  type: 'EXIT' | 'RETURN' | 'STOPPED'
  assetTag: string | null
  gate: string | null
  note: string | null
  createdAt: string
  recordedBy: string
  pass: { id: string; code: string; requester: string } | null
}

export interface GateLog {
  counts: { out: number; back: number; stopped: number; outNow: number; overdue: number }
  events: GateEvent[]
  overdue: GatePass[]
}
