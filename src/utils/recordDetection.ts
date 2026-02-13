// Utilitaires pour la détection de records personnels

import type { Activity } from '../types/activity';
import type { 
  PersonalRecord, 
  RecordType, 
  RecordCategory,
  RecordDetectionResult 
} from '../types/records';
import { DISTANCE_CATEGORIES } from '../types/records';
import { calculateStatistics } from './statistics';

/**
 * Détecte si une activité établit un nouveau record
 */
export function detectRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  
  // Vérifier les records de distance
  results.push(...detectDistanceRecords(activity, existingRecords));
  
  // Vérifier les records de vitesse
  results.push(...detectSpeedRecords(activity, existingRecords));
  
  // Vérifier les records de temps sur distance
  results.push(...detectTimeRecords(activity, existingRecords));
  
  // Vérifier les records de dénivelé
  results.push(...detectElevationRecords(activity, existingRecords));
  
  // Vérifier les records de calories
  results.push(...detectCalorieRecords(activity, existingRecords));
  
  return results.filter(r => r.isRecord);
}

/**
 * Détecte les records de distance
 */
function detectDistanceRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  const distance = activity.distanceMeters;
  
  // Record de plus longue distance
  const longestRecord = existingRecords.find(
    r => r.type === 'distance' && r.category === 'longest' && r.sport === activity.sport
  );
  
  if (!longestRecord || distance > longestRecord.value) {
    results.push({
      isRecord: true,
      recordType: 'distance',
      category: 'longest',
      value: distance,
      previousValue: longestRecord?.value,
      improvement: longestRecord ? distance - longestRecord.value : distance,
      message: `Nouvelle plus longue distance : ${(distance / 1000).toFixed(2)} km`,
    });
  }
  
  return results;
}

/**
 * Détecte les records de vitesse
 */
function detectSpeedRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  const stats = calculateStatistics(activity);
  
  // Record de vitesse maximale
  const speedRecord = existingRecords.find(
    r => r.type === 'speed' && r.category === 'fastest' && r.sport === activity.sport
  );
  
  if (!speedRecord || stats.maxSpeed > speedRecord.value) {
    results.push({
      isRecord: true,
      recordType: 'speed',
      category: 'fastest',
      value: stats.maxSpeed,
      previousValue: speedRecord?.value,
      improvement: speedRecord ? stats.maxSpeed - speedRecord.value : stats.maxSpeed,
      message: `Nouvelle vitesse maximale : ${(stats.maxSpeed * 3.6).toFixed(2)} km/h`,
    });
  }
  
  // Record de vitesse moyenne
  const avgSpeedRecord = existingRecords.find(
    r => r.type === 'speed' && r.category === '10km' && r.sport === activity.sport
  );
  
  // Vérifier si c'est une distance proche de 10km
  if (activity.distanceMeters >= 9500 && activity.distanceMeters <= 10500) {
    if (!avgSpeedRecord || stats.averageSpeed > avgSpeedRecord.value) {
      results.push({
        isRecord: true,
        recordType: 'speed',
        category: '10km',
        value: stats.averageSpeed,
        previousValue: avgSpeedRecord?.value,
        improvement: avgSpeedRecord ? stats.averageSpeed - avgSpeedRecord.value : stats.averageSpeed,
        message: `Nouvelle meilleure vitesse moyenne sur 10km : ${(stats.averageSpeed * 3.6).toFixed(2)} km/h`,
      });
    }
  }
  
  return results;
}

/**
 * Détecte les records de temps sur distance
 */
function detectTimeRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  const distance = activity.distanceMeters;
  const time = activity.totalTimeSeconds;
  
  // Vérifier chaque catégorie de distance
  Object.entries(DISTANCE_CATEGORIES).forEach(([category, { min, max, label }]) => {
    if (distance >= min && distance <= max) {
      const timeRecord = existingRecords.find(
        r => r.type === 'time' && r.category === category && r.sport === activity.sport
      );
      
      // Pour le temps, plus petit = meilleur
      if (!timeRecord || time < timeRecord.value) {
        results.push({
          isRecord: true,
          recordType: 'time',
          category: category as RecordCategory,
          value: time,
          previousValue: timeRecord?.value,
          improvement: timeRecord ? timeRecord.value - time : 0,
          message: `Nouveau record sur ${label} : ${formatTime(time)}`,
        });
      }
    }
  });
  
  return results;
}

/**
 * Détecte les records de dénivelé
 */
function detectElevationRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  const stats = calculateStatistics(activity);
  
  if (!stats.elevationGain) return results;
  
  const elevationRecord = existingRecords.find(
    r => r.type === 'elevation' && r.category === 'highest' && r.sport === activity.sport
  );
  
  if (!elevationRecord || stats.elevationGain > elevationRecord.value) {
    results.push({
      isRecord: true,
      recordType: 'elevation',
      category: 'highest',
      value: stats.elevationGain,
      previousValue: elevationRecord?.value,
      improvement: elevationRecord ? stats.elevationGain - elevationRecord.value : stats.elevationGain,
      message: `Nouveau record de dénivelé : ${stats.elevationGain.toFixed(0)} m`,
    });
  }
  
  return results;
}

/**
 * Détecte les records de calories
 */
function detectCalorieRecords(
  activity: Activity,
  existingRecords: PersonalRecord[]
): RecordDetectionResult[] {
  const results: RecordDetectionResult[] = [];
  
  if (!activity.calories) return results;
  
  const calorieRecord = existingRecords.find(
    r => r.type === 'calories' && r.sport === activity.sport
  );
  
  if (!calorieRecord || activity.calories > calorieRecord.value) {
    results.push({
      isRecord: true,
      recordType: 'calories',
      category: 'longest', // Utiliser 'longest' comme catégorie par défaut
      value: activity.calories,
      previousValue: calorieRecord?.value,
      improvement: calorieRecord ? activity.calories - calorieRecord.value : activity.calories,
      message: `Nouveau record de calories : ${activity.calories} kcal`,
    });
  }
  
  return results;
}

/**
 * Crée un objet PersonalRecord à partir d'un résultat de détection
 */
export function createRecordFromDetection(
  detection: RecordDetectionResult,
  activity: Activity
): PersonalRecord {
  return {
    id: `${activity.id}-${detection.recordType}-${detection.category}`,
    type: detection.recordType!,
    category: detection.category!,
    value: detection.value!,
    unit: getUnitForRecordType(detection.recordType!),
    activityId: activity.id,
    activityDate: activity.startTime,
    sport: activity.sport,
    previousValue: detection.previousValue,
    improvement: detection.improvement,
    createdAt: new Date(),
    isNew: true,
  };
}

/**
 * Obtient l'unité pour un type de record
 */
function getUnitForRecordType(type: RecordType): string {
  const units: Record<RecordType, string> = {
    distance: 'm',
    speed: 'm/s',
    pace: 'min/km',
    time: 's',
    elevation: 'm',
    calories: 'kcal',
    heartRate: 'bpm',
  };
  
  return units[type];
}

/**
 * Formate un temps en secondes en format lisible
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}min ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Compare une activité à un record existant
 */
export function compareToRecord(
  activity: Activity,
  record: PersonalRecord
): {
  isBetter: boolean;
  difference: number;
  percentageDifference: number;
} {
  const stats = calculateStatistics(activity);
  let currentValue: number;
  
  switch (record.type) {
    case 'distance':
      currentValue = activity.distanceMeters;
      break;
    case 'speed':
      currentValue = record.category === 'fastest' ? stats.maxSpeed : stats.averageSpeed;
      break;
    case 'time':
      currentValue = activity.totalTimeSeconds;
      break;
    case 'elevation':
      currentValue = stats.elevationGain || 0;
      break;
    case 'calories':
      currentValue = activity.calories || 0;
      break;
    default:
      currentValue = 0;
  }
  
  // Pour le temps, plus petit = meilleur
  const isBetter = record.type === 'time' 
    ? currentValue < record.value 
    : currentValue > record.value;
  
  const difference = record.type === 'time'
    ? record.value - currentValue
    : currentValue - record.value;
  
  const percentageDifference = (Math.abs(difference) / record.value) * 100;
  
  return {
    isBetter,
    difference,
    percentageDifference,
  };
}

/**
 * Obtient la catégorie de distance pour une activité
 */
export function getDistanceCategory(distanceMeters: number): RecordCategory | null {
  for (const [category, { min, max }] of Object.entries(DISTANCE_CATEGORIES)) {
    if (distanceMeters >= min && distanceMeters <= max) {
      return category as RecordCategory;
    }
  }
  return null;
}

/**
 * Vérifie si une activité est éligible pour un record de temps
 */
export function isEligibleForTimeRecord(activity: Activity): boolean {
  return getDistanceCategory(activity.distanceMeters) !== null;
}

/**
 * Calcule le pourcentage d'amélioration
 */
export function calculateImprovement(current: number, previous: number, type: RecordType): number {
  if (type === 'time') {
    // Pour le temps, amélioration = réduction du temps
    return ((previous - current) / previous) * 100;
  } else {
    // Pour les autres, amélioration = augmentation
    return ((current - previous) / previous) * 100;
  }
}

// Made with Bob