// Types pour les records personnels

export type RecordType = 
  | 'distance' // Plus longue distance
  | 'speed' // Vitesse maximale
  | 'pace' // Meilleure allure
  | 'time' // Meilleur temps sur distance
  | 'elevation' // Plus grand dénivelé
  | 'calories' // Plus de calories
  | 'heartRate'; // Meilleure FC moyenne

export type RecordCategory = 
  | '1km'
  | '5km'
  | '10km'
  | 'halfMarathon' // 21.1km
  | 'marathon' // 42.2km
  | 'longest' // Plus longue distance
  | 'fastest' // Plus rapide
  | 'highest'; // Plus haut dénivelé

export interface PersonalRecord {
  id: string;
  type: RecordType;
  category: RecordCategory;
  value: number; // Valeur du record (dépend du type)
  unit: string; // Unité de mesure
  activityId: string;
  activityDate: Date;
  sport: string;
  previousValue?: number;
  previousActivityId?: string;
  previousDate?: Date;
  improvement?: number; // Amélioration en % ou valeur absolue
  createdAt: Date;
  isNew?: boolean; // Pour afficher le badge "Nouveau"
}

export interface RecordsByCategory {
  category: RecordCategory;
  label: string;
  description: string;
  records: PersonalRecord[];
  icon: string;
}

export interface RecordHistory {
  recordId: string;
  type: RecordType;
  category: RecordCategory;
  entries: RecordHistoryEntry[];
}

export interface RecordHistoryEntry {
  value: number;
  activityId: string;
  date: Date;
  improvement?: number;
  note?: string;
}

export interface RecordComparison {
  current: PersonalRecord;
  target?: PersonalRecord; // Record à battre
  difference: number;
  percentageToTarget?: number;
  isPersonalBest: boolean;
}

export interface RecordDetectionResult {
  isRecord: boolean;
  recordType?: RecordType;
  category?: RecordCategory;
  value?: number;
  previousValue?: number;
  improvement?: number;
  message?: string;
}

export interface RecordStatistics {
  totalRecords: number;
  recordsBySport: Record<string, number>;
  recordsByType: Record<RecordType, number>;
  recentRecords: PersonalRecord[]; // 5 derniers records
  longestStreak: number; // Plus longue série de records
  lastRecordDate?: Date;
}

export interface RecordGoal {
  id: string;
  type: RecordType;
  category: RecordCategory;
  targetValue: number;
  currentValue: number;
  deadline?: Date;
  description: string;
  achieved: boolean;
  achievedDate?: Date;
}

// Définitions des catégories de distance
export const DISTANCE_CATEGORIES: Record<string, { min: number; max: number; label: string }> = {
  '1km': { min: 900, max: 1100, label: '1 km' },
  '5km': { min: 4500, max: 5500, label: '5 km' },
  '10km': { min: 9500, max: 10500, label: '10 km' },
  'halfMarathon': { min: 20000, max: 22000, label: 'Semi-marathon' },
  'marathon': { min: 41000, max: 43000, label: 'Marathon' },
};

// Labels pour les types de records
export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  distance: 'Distance',
  speed: 'Vitesse',
  pace: 'Allure',
  time: 'Temps',
  elevation: 'Dénivelé',
  calories: 'Calories',
  heartRate: 'Fréquence cardiaque',
};

// Icônes pour les catégories
export const RECORD_CATEGORY_ICONS: Record<RecordCategory, string> = {
  '1km': '🏃',
  '5km': '🏃‍♂️',
  '10km': '🏃‍♀️',
  'halfMarathon': '🎽',
  'marathon': '🏅',
  'longest': '📏',
  'fastest': '⚡',
  'highest': '🏔️',
};

// Descriptions des catégories
export const RECORD_CATEGORY_DESCRIPTIONS: Record<RecordCategory, string> = {
  '1km': 'Meilleur temps sur 1 kilomètre',
  '5km': 'Meilleur temps sur 5 kilomètres',
  '10km': 'Meilleur temps sur 10 kilomètres',
  'halfMarathon': 'Meilleur temps sur semi-marathon (21.1 km)',
  'marathon': 'Meilleur temps sur marathon (42.2 km)',
  'longest': 'Plus longue distance parcourue',
  'fastest': 'Vitesse maximale atteinte',
  'highest': 'Plus grand dénivelé positif',
};

// Made with Bob