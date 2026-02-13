// Utilitaires pour les calculs de zones d'entraînement

import type { 
  HeartRateZone, 
  ZoneNumber, 
  ZoneThresholds, 
  ZoneDistribution,
  ZonePercentages,
  ZoneCalculationMethod,
  TrainingType
} from '../types/trainingZones';
import { ZONE_COLORS, ZONE_NAMES, ZONE_DESCRIPTIONS, ZONE_PERCENTAGES } from '../types/trainingZones';
import type { Activity, Trackpoint } from '../types/activity';

/**
 * Calcule la fréquence cardiaque maximale basée sur l'âge
 */
export function calculateMaxHRFromAge(age: number): number {
  return Math.round(220 - age);
}

/**
 * Calcule la fréquence cardiaque de réserve (méthode Karvonen)
 */
export function calculateHRReserve(maxHR: number, restingHR: number): number {
  return maxHR - restingHR;
}

/**
 * Calcule la FC cible avec la méthode Karvonen
 */
export function calculateTargetHRKarvonen(
  maxHR: number,
  restingHR: number,
  intensityPercent: number
): number {
  const hrReserve = calculateHRReserve(maxHR, restingHR);
  return Math.round(hrReserve * (intensityPercent / 100) + restingHR);
}

/**
 * Définit les zones d'entraînement basées sur les paramètres
 */
export function defineZones(
  maxHR: number,
  restingHR?: number,
  method: ZoneCalculationMethod = 'age'
): HeartRateZone[] {
  const zones: HeartRateZone[] = [];
  
  for (let zoneNum = 1; zoneNum <= 5; zoneNum++) {
    const zone = zoneNum as ZoneNumber;
    const percentRange = ZONE_PERCENTAGES[zone];
    
    let minHR: number;
    let maxHR_zone: number;
    
    if (method === 'karvonen' && restingHR) {
      minHR = calculateTargetHRKarvonen(maxHR, restingHR, percentRange.min);
      maxHR_zone = calculateTargetHRKarvonen(maxHR, restingHR, percentRange.max);
    } else {
      minHR = Math.round(maxHR * (percentRange.min / 100));
      maxHR_zone = Math.round(maxHR * (percentRange.max / 100));
    }
    
    zones.push({
      zone,
      name: ZONE_NAMES[zone],
      description: ZONE_DESCRIPTIONS[zone],
      minHR,
      maxHR: maxHR_zone,
      minPercent: percentRange.min,
      maxPercent: percentRange.max,
      color: ZONE_COLORS[zone],
      benefits: getZoneBenefits(zone),
      recommendations: getZoneRecommendations(zone),
    });
  }
  
  return zones;
}

/**
 * Obtient les bénéfices d'une zone
 */
function getZoneBenefits(zone: ZoneNumber): string[] {
  const benefits: Record<ZoneNumber, string[]> = {
    1: [
      'Récupération active',
      'Amélioration de la circulation',
      'Préparation à l\'effort',
    ],
    2: [
      'Développement de l\'endurance de base',
      'Amélioration du métabolisme des graisses',
      'Renforcement cardiovasculaire',
    ],
    3: [
      'Amélioration de l\'efficacité aérobie',
      'Augmentation de la capacité lactique',
      'Développement de l\'endurance',
    ],
    4: [
      'Amélioration du seuil lactique',
      'Augmentation de la vitesse de course',
      'Développement de la puissance',
    ],
    5: [
      'Amélioration de la VO2 max',
      'Développement de la puissance maximale',
      'Amélioration de la vitesse',
    ],
  };
  
  return benefits[zone];
}

/**
 * Obtient les recommandations pour une zone
 */
function getZoneRecommendations(zone: ZoneNumber): string {
  const recommendations: Record<ZoneNumber, string> = {
    1: 'Idéal pour la récupération entre les séances intenses. Durée : 20-60 minutes.',
    2: 'Base de l\'entraînement. 70-80% du volume total. Durée : 45-120 minutes.',
    3: 'Séances tempo 1-2 fois par semaine. Durée : 20-60 minutes.',
    4: 'Intervalles au seuil 1 fois par semaine. Durée : 10-30 minutes cumulées.',
    5: 'Intervalles courts et intenses. Maximum 1-2 fois par semaine. Durée : 5-15 minutes cumulées.',
  };
  
  return recommendations[zone];
}

/**
 * Détermine la zone pour une fréquence cardiaque donnée
 */
export function getZoneForHeartRate(heartRate: number, zones: HeartRateZone[]): ZoneNumber | null {
  for (const zone of zones) {
    if (heartRate >= zone.minHR && heartRate <= zone.maxHR) {
      return zone.zone;
    }
  }
  
  // Si FC > zone 5, retourner zone 5
  if (heartRate > zones[4].maxHR) {
    return 5;
  }
  
  // Si FC < zone 1, retourner zone 1
  if (heartRate < zones[0].minHR) {
    return 1;
  }
  
  return null;
}

/**
 * Calcule le temps passé dans chaque zone pour une activité
 */
export function calculateTimeInZones(
  activity: Activity,
  zones: HeartRateZone[]
): ZoneDistribution {
  const distribution: ZoneDistribution = {
    zone1: 0,
    zone2: 0,
    zone3: 0,
    zone4: 0,
    zone5: 0,
    unknown: 0,
  };
  
  // Collecter tous les trackpoints avec leur durée
  const trackpoints: Array<{ hr?: number; duration: number }> = [];
  
  activity.laps.forEach(lap => {
    for (let i = 0; i < lap.trackpoints.length; i++) {
      const current = lap.trackpoints[i];
      const next = lap.trackpoints[i + 1];
      
      if (next) {
        const duration = (new Date(next.time).getTime() - new Date(current.time).getTime()) / 1000;
        trackpoints.push({ hr: current.heartRate, duration });
      }
    }
  });
  
  // Calculer le temps dans chaque zone
  trackpoints.forEach(({ hr, duration }) => {
    if (!hr) {
      distribution.unknown += duration;
      return;
    }
    
    const zone = getZoneForHeartRate(hr, zones);
    
    if (zone === null) {
      distribution.unknown += duration;
    } else {
      const key = `zone${zone}` as keyof ZoneDistribution;
      distribution[key] += duration;
    }
  });
  
  return distribution;
}

/**
 * Convertit la distribution en pourcentages
 */
export function calculateZonePercentages(distribution: ZoneDistribution): ZonePercentages {
  const total = Object.values(distribution).reduce((sum, time) => sum + time, 0);
  
  if (total === 0) {
    return {
      zone1: 0,
      zone2: 0,
      zone3: 0,
      zone4: 0,
      zone5: 0,
      unknown: 0,
    };
  }
  
  return {
    zone1: Math.round((distribution.zone1 / total) * 100),
    zone2: Math.round((distribution.zone2 / total) * 100),
    zone3: Math.round((distribution.zone3 / total) * 100),
    zone4: Math.round((distribution.zone4 / total) * 100),
    zone5: Math.round((distribution.zone5 / total) * 100),
    unknown: Math.round((distribution.unknown / total) * 100),
  };
}

/**
 * Détermine la zone dominante
 */
export function getDominantZone(distribution: ZoneDistribution): ZoneNumber | null {
  const zones = [
    { zone: 1 as ZoneNumber, time: distribution.zone1 },
    { zone: 2 as ZoneNumber, time: distribution.zone2 },
    { zone: 3 as ZoneNumber, time: distribution.zone3 },
    { zone: 4 as ZoneNumber, time: distribution.zone4 },
    { zone: 5 as ZoneNumber, time: distribution.zone5 },
  ];
  
  const maxZone = zones.reduce((max, current) => 
    current.time > max.time ? current : max
  );
  
  return maxZone.time > 0 ? maxZone.zone : null;
}

/**
 * Détermine le type d'entraînement basé sur la distribution des zones
 */
export function determineTrainingType(percentages: ZonePercentages): TrainingType {
  // Récupération : >60% en Z1-Z2
  if (percentages.zone1 + percentages.zone2 > 60 && percentages.zone1 > percentages.zone2) {
    return 'recovery';
  }
  
  // Endurance : >70% en Z2-Z3, avec Z2 dominant
  if (percentages.zone2 + percentages.zone3 > 70 && percentages.zone2 > percentages.zone3) {
    return 'endurance';
  }
  
  // Tempo : >50% en Z3-Z4, avec Z3 dominant
  if (percentages.zone3 + percentages.zone4 > 50 && percentages.zone3 > percentages.zone4) {
    return 'tempo';
  }
  
  // Seuil : >40% en Z4
  if (percentages.zone4 > 40) {
    return 'threshold';
  }
  
  // Intervalles : >20% en Z5 ou mix Z4-Z5
  if (percentages.zone5 > 20 || (percentages.zone4 + percentages.zone5 > 50 && percentages.zone5 > 15)) {
    return 'interval';
  }
  
  // Mixte : répartition variée
  if (percentages.unknown < 50) {
    return 'mixed';
  }
  
  return 'unknown';
}

/**
 * Calcule l'efficacité de l'entraînement (0-100)
 */
export function calculateTrainingEfficiency(
  percentages: ZonePercentages,
  trainingType: TrainingType
): number {
  // Répartition idéale selon le type d'entraînement
  const idealDistributions: Record<TrainingType, Partial<ZonePercentages>> = {
    recovery: { zone1: 60, zone2: 40 },
    endurance: { zone2: 70, zone3: 20, zone1: 10 },
    tempo: { zone3: 60, zone2: 25, zone4: 15 },
    threshold: { zone4: 60, zone3: 30, zone2: 10 },
    interval: { zone5: 40, zone4: 40, zone3: 20 },
    mixed: { zone2: 30, zone3: 30, zone4: 20, zone5: 10, zone1: 10 },
    unknown: {},
  };
  
  const ideal = idealDistributions[trainingType];
  
  if (Object.keys(ideal).length === 0) {
    return 50; // Score neutre pour type inconnu
  }
  
  // Calculer la différence avec la distribution idéale
  let totalDiff = 0;
  let count = 0;
  
  Object.entries(ideal).forEach(([zone, idealPercent]) => {
    const actualPercent = percentages[zone as keyof ZonePercentages];
    const diff = Math.abs(actualPercent - idealPercent);
    totalDiff += diff;
    count++;
  });
  
  const avgDiff = totalDiff / count;
  const efficiency = Math.max(0, 100 - avgDiff);
  
  return Math.round(efficiency);
}

/**
 * Obtient la couleur d'une zone
 */
export function getZoneColor(zone: ZoneNumber): string {
  return ZONE_COLORS[zone];
}

/**
 * Obtient le nom d'une zone
 */
export function getZoneName(zone: ZoneNumber): string {
  return ZONE_NAMES[zone];
}

// Made with Bob