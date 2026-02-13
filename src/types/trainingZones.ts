// Types pour les zones d'entraînement basées sur la fréquence cardiaque

export type ZoneNumber = 1 | 2 | 3 | 4 | 5;

export type ZoneCalculationMethod = 'age' | 'karvonen' | 'manual';

export interface HeartRateZone {
  zone: ZoneNumber;
  name: string;
  description: string;
  minHR: number; // BPM
  maxHR: number; // BPM
  minPercent: number; // % de FC max
  maxPercent: number; // % de FC max
  color: string; // Couleur hex pour visualisation
  benefits: string[];
  recommendations: string;
}

export interface ZoneThresholds {
  maxHeartRate: number;
  restingHeartRate?: number;
  zones: HeartRateZone[];
  method: ZoneCalculationMethod;
  age?: number;
  customThresholds?: number[]; // Pour méthode manuelle
}

export interface ZoneDistribution {
  zone1: number; // temps en secondes
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
  unknown: number; // temps sans données FC
}

export interface ZonePercentages {
  zone1: number; // pourcentage 0-100
  zone2: number;
  zone3: number;
  zone4: number;
  zone5: number;
  unknown: number;
}

export interface ZoneAnalysis {
  distribution: ZoneDistribution;
  percentages: ZonePercentages;
  dominantZone: ZoneNumber | null;
  timeInTargetZone?: number; // si objectif de zone défini
  recommendations: string[];
  trainingType: TrainingType;
  efficiency: number; // 0-100, basé sur la répartition des zones
}

export type TrainingType = 
  | 'recovery' // Principalement Z1-Z2
  | 'endurance' // Principalement Z2-Z3
  | 'tempo' // Principalement Z3-Z4
  | 'threshold' // Principalement Z4
  | 'interval' // Mix Z4-Z5
  | 'mixed' // Répartition variée
  | 'unknown'; // Pas assez de données

export interface ZoneSettings {
  id: string;
  userId?: string;
  maxHeartRate: number;
  restingHeartRate?: number;
  method: ZoneCalculationMethod;
  age?: number;
  customZones?: HeartRateZone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneTarget {
  targetZone: ZoneNumber;
  minTimePercent: number; // % minimum de temps dans la zone
  maxTimePercent: number; // % maximum de temps dans la zone
  description: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  zoneTargets: ZoneTarget[];
  recommendedDuration: number; // en minutes
  frequency: number; // fois par semaine
}

export interface ZoneHistory {
  activityId: string;
  date: Date;
  distribution: ZoneDistribution;
  dominantZone: ZoneNumber | null;
  trainingType: TrainingType;
}

// Constantes pour les zones standard
export const ZONE_COLORS: Record<ZoneNumber, string> = {
  1: '#3B82F6', // Bleu
  2: '#10B981', // Vert
  3: '#F59E0B', // Jaune
  4: '#F97316', // Orange
  5: '#EF4444', // Rouge
};

export const ZONE_NAMES: Record<ZoneNumber, string> = {
  1: 'Récupération',
  2: 'Endurance',
  3: 'Tempo',
  4: 'Seuil',
  5: 'VO2 Max',
};

export const ZONE_DESCRIPTIONS: Record<ZoneNumber, string> = {
  1: 'Récupération active, conversation facile',
  2: 'Endurance de base, développement aérobie',
  3: 'Tempo confortable, amélioration aérobie',
  4: 'Seuil lactique, effort soutenu',
  5: 'Puissance maximale, intervalles courts',
};

// Pourcentages standard pour chaque zone (méthode âge)
export const ZONE_PERCENTAGES: Record<ZoneNumber, { min: number; max: number }> = {
  1: { min: 50, max: 60 },
  2: { min: 60, max: 70 },
  3: { min: 70, max: 80 },
  4: { min: 80, max: 90 },
  5: { min: 90, max: 100 },
};

// Made with Bob