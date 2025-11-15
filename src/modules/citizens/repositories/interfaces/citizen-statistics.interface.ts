/**
 * Interface for citizen statistics
 * Used by repository layer for aggregated data
 */
export interface ICitizenStatistics {
  totalCitizens: number;
  blockedCitizens: number;
  activeCitizens: number;
}
