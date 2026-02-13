// Types pour l'intégration Strava API

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  expires_in: number;
  token_type: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // Run, Ride, Swim, etc.
  sport_type: string;
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_cadence?: number;
  average_temp?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  description?: string;
  photos?: {
    primary?: {
      id: number;
      source: number;
      unique_id: string;
      urls: Record<string, string>;
    };
  };
}

export interface StravaDetailedActivity extends StravaActivity {
  calories: number;
  description: string;
  gear: {
    id: string;
    primary: boolean;
    name: string;
    distance: number;
  } | null;
  laps: StravaLap[];
  splits_metric: StravaSplit[];
  splits_standard: StravaSplit[];
  best_efforts?: StravaBestEffort[];
  segment_efforts?: StravaSegmentEffort[];
}

export interface StravaLap {
  id: number;
  activity: { id: number };
  athlete: { id: number };
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
  split: number;
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  average_grade_adjusted_speed?: number;
  average_heartrate?: number;
  pace_zone?: number;
}

export interface StravaBestEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  pr_rank: number | null;
  achievements: any[];
}

export interface StravaSegmentEffort {
  id: number;
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  average_cadence?: number;
  average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  segment: {
    id: number;
    name: string;
    activity_type: string;
    distance: number;
    average_grade: number;
    maximum_grade: number;
    elevation_high: number;
    elevation_low: number;
    climb_category: number;
  };
  kom_rank: number | null;
  pr_rank: number | null;
  achievements: any[];
}

export interface StravaStream {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export interface StravaStreamSet {
  time?: StravaStream;
  distance?: StravaStream;
  latlng?: StravaStream;
  altitude?: StravaStream;
  velocity_smooth?: StravaStream;
  heartrate?: StravaStream;
  cadence?: StravaStream;
  watts?: StravaStream;
  temp?: StravaStream;
  moving?: StravaStream;
  grade_smooth?: StravaStream;
}

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface StravaAuthState {
  isAuthenticated: boolean;
  athlete: StravaAthlete | null;
  tokens: StravaTokens | null;
  lastSync: Date | null;
}

export interface StravaSyncOptions {
  limit?: number; // Number of activities to fetch (max 200)
  before?: number; // Unix timestamp
  after?: number; // Unix timestamp
  page?: number;
}

export interface StravaSyncResult {
  success: boolean;
  activitiesImported: number;
  activitiesSkipped: number;
  errors: string[];
}

// Mapping des types de sport Strava vers nos types
export const STRAVA_SPORT_TYPE_MAP: Record<string, string> = {
  'Run': 'Running',
  'TrailRun': 'Running',
  'VirtualRun': 'Running',
  'Ride': 'Cycling',
  'MountainBikeRide': 'Cycling',
  'GravelRide': 'Cycling',
  'EBikeRide': 'Cycling',
  'VirtualRide': 'Cycling',
  'Walk': 'Walking',
  'Hike': 'Hiking',
  'Swim': 'Swimming',
  'AlpineSki': 'Other',
  'BackcountrySki': 'Other',
  'Canoeing': 'Other',
  'Crossfit': 'Other',
  'EBikeMountainBikeRide': 'Cycling',
  'Elliptical': 'Other',
  'Golf': 'Other',
  'Handcycle': 'Cycling',
  'IceSkate': 'Other',
  'InlineSkate': 'Other',
  'Kayaking': 'Other',
  'Kitesurf': 'Other',
  'NordicSki': 'Other',
  'RockClimbing': 'Other',
  'RollerSki': 'Other',
  'Rowing': 'Other',
  'Snowboard': 'Other',
  'Snowshoe': 'Other',
  'Soccer': 'Other',
  'StairStepper': 'Other',
  'StandUpPaddling': 'Other',
  'Surfing': 'Other',
  'Velomobile': 'Cycling',
  'WeightTraining': 'Other',
  'Wheelchair': 'Other',
  'Windsurf': 'Other',
  'Workout': 'Other',
  'Yoga': 'Other',
};

// Made with Bob