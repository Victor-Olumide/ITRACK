export interface DashboardSummary {
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
}
