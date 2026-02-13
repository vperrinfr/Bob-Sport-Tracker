// Types pour les données d'activité sportive

export interface Trackpoint {
  time: Date;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  distance?: number;
  heartRate?: number;
  cadence?: number;
  speed?: number;
  power?: number;
}

export interface Lap {
  startTime: Date;
  totalTimeSeconds: number;
  distanceMeters: number;
  maximumSpeed?: number;
  calories?: number;
  averageHeartRate?: number;
  maximumHeartRate?: number;
  intensity?: 'Active' | 'Resting';
  cadence?: number;
  triggerMethod?: string;
  trackpoints: Trackpoint[];
}

export interface Activity {
  id: string;
  sport: string;
  startTime: Date;
  totalTimeSeconds: number;
  distanceMeters: number;
  calories?: number;
  notes?: string;
  laps: Lap[];
  creator?: {
    name?: string;
    version?: string;
    unitId?: string;
    productId?: string;
  };
}

export interface Statistics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  averageCadence?: number;
  maxCadence?: number;
  totalCalories?: number;
  elevationGain?: number;
  elevationLoss?: number;
  minAltitude?: number;
  maxAltitude?: number;
  averagePace?: number;
  maxPace?: number;
}

export interface ActivityFilter {
  sport?: string;
  startDate?: Date;
  endDate?: Date;
  minDistance?: number;
  maxDistance?: number;
  minDuration?: number;
  maxDuration?: number;
  searchQuery?: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeTrackpoints?: boolean;
  includeStatistics?: boolean;
  includeCharts?: boolean;
  includeMap?: boolean;
}

export type SportType = 
  | 'Running'
  | 'Biking'
  | 'Cycling'
  | 'Walking'
  | 'Hiking'
  | 'Swimming'
  | 'Other';

export interface ChartDataPoint {
  time: number;
  value: number;
  label?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Made with Bob
