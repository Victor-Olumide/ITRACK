export type ApiTicketType = 'PROBLEM' | 'REQUEST';
export type ApiTicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_USER'
  | 'RESOLVED'
  | 'CLOSED';
export type ApiTicketPriority =
  | 'P1_CRITICAL'
  | 'P2_HIGH'
  | 'P3_MEDIUM'
  | 'P4_LOW'
  | 'P5_PLANNING';
export type ApiTicketImpact = 'HIGH' | 'MEDIUM' | 'LOW';
export type ApiTicketUrgency = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TicketApiUser {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  role?: string;
  department?: { id: string; name: string };
}

export interface TicketApiAsset {
  id: string;
  assetTag: string;
  make: string;
  model: string;
}

export interface TicketApiComment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: Pick<TicketApiUser, 'id' | 'staffId' | 'fullName' | 'role'>;
}

export interface TicketApiEvent {
  id: string;
  type: 'STATUS' | 'ASSIGN' | 'PRIORITY' | 'DELETE';
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actor: Pick<TicketApiUser, 'id' | 'staffId' | 'fullName' | 'role'>;
}

export interface TicketApiRecord {
  id: string;
  number: string;
  type: ApiTicketType;
  title: string;
  description: string;
  category: { id: string; name: string };
  priority: ApiTicketPriority;
  impact: ApiTicketImpact;
  urgency: ApiTicketUrgency;
  status: ApiTicketStatus;
  resolutionNote: string | null;
  reporter: TicketApiUser;
  assignee: TicketApiUser | null;
  asset: TicketApiAsset | null;
  comments?: TicketApiComment[];
  events?: TicketApiEvent[];
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  overdue: boolean;
}

export interface TicketListResponse {
  data: TicketApiRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface TicketSuggestionRequest {
  title: string;
  description?: string;
}

export interface TicketSuggestionResponse {
  category: string | null;
  priority: string;
  confidence: number;
}

export interface TicketListArgs {
  q?: string;
  status?: ApiTicketStatus;
  priority?: ApiTicketPriority;
  category?: string;
  assigneeId?: string | 'unassigned';
  page?: number;
  pageSize?: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  type: ApiTicketType;
  impact: ApiTicketImpact;
  urgency: ApiTicketUrgency;
  assetId?: string | null;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  category?: string;
  impact?: ApiTicketImpact;
  urgency?: ApiTicketUrgency;
}

export interface ChangeTicketStatusRequest {
  to: ApiTicketStatus;
  resolutionNote?: string;
  comment?: string;
}
