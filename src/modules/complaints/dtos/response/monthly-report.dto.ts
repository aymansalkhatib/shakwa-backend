export class MonthlyReportDto {
  reportDate: string;
  period: {
    start: string;
    end: string;
    month: string;
    year: number;
  };
  summary: {
    totalComplaints: number;
    totalAllTime: number;
  };
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  authorityBreakdown: Record<string, number>;
}
