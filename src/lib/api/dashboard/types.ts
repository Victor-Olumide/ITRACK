export interface DashboardSummary {
  period: {
    from: string;
    to: string;
  };
  counts: {
    total: number;
    byStatus: Record<string, number>;
  };
  resolutionTime: {
    resolvedTickets: number;
    averageHours: number | null;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    category: string;
    count: number;
  }>;
  overdueTickets: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    assignee: { id: string; fullName: string } | null;
  }>;
  technicianWorkload: Array<{
    technicianId: string;
    technicianName: string;
    openTickets: number;
    overdueTickets: number;
  }>;
  assetSummary: {
    countsByType: Array<{ type: string; count: number }>;
    countsByCondition: Array<{ condition: string; count: number }>;
    warrantiesExpiringIn30Days: number;
  };
}
