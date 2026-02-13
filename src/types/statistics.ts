// Types pour les statistiques par période

export type PeriodType = 'week' | 'month' | 'year' | 'custom' | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodStatistics {
  period: PeriodType;
  dateRange: DateRange;
  totalActivities: number;
  totalDistance: number; // en mètres
  totalTime: number; // en secondes
  totalCalories: number;
  totalElevationGain: number; // en mètres
  averageSpeed: number; // en m/s
  averageHeartRate?: number;
  averageCadence?: number;
  sportBreakdown: Record<string, {
    count: number;
    distance: number;
    time: number;
  }>;
}

export interface TrendData {
  date: Date;
  value: number;
  label?: string;
}

export interface ComparisonData {
  current: PeriodStatistics;
  previous: PeriodStatistics;
  changes: {
    distance: number; // pourcentage de changement
    time: number;
    activities: number;
    speed: number;
  };
}

export interface EvolutionMetric {
  type: 'distance' | 'time' | 'speed' | 'heartRate' | 'activities';
  label: string;
  unit: string;
  data: TrendData[];
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface WeeklyBreakdown {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  statistics: PeriodStatistics;
}

export interface MonthlyBreakdown {
  month: number;
  year: number;
  statistics: PeriodStatistics;
}

export interface YearlyBreakdown {
  year: number;
  statistics: PeriodStatistics;
  monthlyData: MonthlyBreakdown[];
}

export interface ActivityHeatmap {
  date: Date;
  count: number;
  distance: number;
  intensity: number; // 0-1
}

export interface PeriodGoal {
  id: string;
  type: 'distance' | 'time' | 'activities' | 'calories';
  target: number;
  current: number;
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  completed: boolean;
}

// Made with Bob