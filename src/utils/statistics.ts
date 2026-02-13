import type { Activity, Statistics, Trackpoint } from '../types/activity';

/**
 * Calcule les statistiques détaillées d'une activité
 */
export function calculateStatistics(activity: Activity): Statistics {
  const allTrackpoints: Trackpoint[] = [];
  
  // Collecter tous les trackpoints de tous les laps
  activity.laps.forEach(lap => {
    allTrackpoints.push(...lap.trackpoints);
  });

  if (allTrackpoints.length === 0) {
    return {
      totalDistance: activity.distanceMeters,
      totalTime: activity.totalTimeSeconds,
      averageSpeed: activity.distanceMeters / activity.totalTimeSeconds,
      maxSpeed: 0,
      totalCalories: activity.calories,
    };
  }

  // Calculer les statistiques de fréquence cardiaque
  const heartRates = allTrackpoints
    .map(tp => tp.heartRate)
    .filter((hr): hr is number => hr !== undefined);
  
  const averageHeartRate = heartRates.length > 0
    ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
    : undefined;
  
  const maxHeartRate = heartRates.length > 0
    ? Math.max(...heartRates)
    : undefined;
  
  const minHeartRate = heartRates.length > 0
    ? Math.min(...heartRates)
    : undefined;

  // Calculer les statistiques de cadence
  const cadences = allTrackpoints
    .map(tp => tp.cadence)
    .filter((c): c is number => c !== undefined);
  
  const averageCadence = cadences.length > 0
    ? cadences.reduce((sum, c) => sum + c, 0) / cadences.length
    : undefined;
  
  const maxCadence = cadences.length > 0
    ? Math.max(...cadences)
    : undefined;

  // Calculer les statistiques d'altitude
  const altitudes = allTrackpoints
    .map(tp => tp.altitude)
    .filter((alt): alt is number => alt !== undefined);
  
  let elevationGain = 0;
  let elevationLoss = 0;
  
  for (let i = 1; i < altitudes.length; i++) {
    const diff = altitudes[i] - altitudes[i - 1];
    if (diff > 0) {
      elevationGain += diff;
    } else {
      elevationLoss += Math.abs(diff);
    }
  }
  
  const minAltitude = altitudes.length > 0 ? Math.min(...altitudes) : undefined;
  const maxAltitude = altitudes.length > 0 ? Math.max(...altitudes) : undefined;

  // Calculer les statistiques de vitesse
  const speeds = allTrackpoints
    .map(tp => tp.speed)
    .filter((s): s is number => s !== undefined && s > 0);
  
  let maxSpeed = 0;
  let averageSpeed = 0;

  if (speeds.length > 0) {
    maxSpeed = Math.max(...speeds);
    averageSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
  } else {
    // Calculer la vitesse à partir de la distance et du temps
    averageSpeed = activity.distanceMeters / activity.totalTimeSeconds;
    
    // Calculer la vitesse max à partir des laps
    maxSpeed = Math.max(...activity.laps.map(lap => lap.maximumSpeed || 0));
  }

  // Calculer l'allure (min/km) - inverse de la vitesse
  const averagePace = averageSpeed > 0 ? 1000 / (averageSpeed * 60) : undefined;
  const maxPace = maxSpeed > 0 ? 1000 / (maxSpeed * 60) : undefined;

  return {
    totalDistance: activity.distanceMeters,
    totalTime: activity.totalTimeSeconds,
    averageSpeed,
    maxSpeed,
    averageHeartRate,
    maxHeartRate,
    minHeartRate,
    averageCadence,
    maxCadence,
    totalCalories: activity.calories,
    elevationGain: elevationGain > 0 ? elevationGain : undefined,
    elevationLoss: elevationLoss > 0 ? elevationLoss : undefined,
    minAltitude,
    maxAltitude,
    averagePace,
    maxPace,
  };
}

/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcule les calories brûlées (formule approximative)
 */
export function calculateCalories(
  durationMinutes: number,
  averageHeartRate?: number,
  weight: number = 70 // Poids par défaut en kg
): number {
  if (!averageHeartRate) {
    // Formule simple basée sur la durée et le poids
    return Math.round(durationMinutes * 10 * (weight / 70));
  }

  // Formule basée sur la fréquence cardiaque
  // Calories = (durée en minutes × (0.6309 × FC + 0.1988 × poids + 0.2017 × âge - 55.0969)) / 4.184
  const age = 30; // Âge par défaut
  const calories =
    (durationMinutes *
      (0.6309 * averageHeartRate + 0.1988 * weight + 0.2017 * age - 55.0969)) /
    4.184;

  return Math.round(Math.max(0, calories));
}

/**
 * Formate la durée en heures:minutes:secondes
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

/**
 * Formate la distance en km
 */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Formate la vitesse en km/h
 */
export function formatSpeed(metersPerSecond: number): string {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(2)} km/h`;
}

/**
 * Formate l'allure en min/km
 */
export function formatPace(minutesPerKm: number): string {
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

/**
 * Calcule les statistiques agrégées pour plusieurs activités
 */
export function calculateAggregateStatistics(activities: Activity[]): {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  totalCalories: number;
  averageDistance: number;
  averageTime: number;
  averageSpeed: number;
} {
  const totalActivities = activities.length;
  const totalDistance = activities.reduce((sum, a) => sum + a.distanceMeters, 0);
  const totalTime = activities.reduce((sum, a) => sum + a.totalTimeSeconds, 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);

  return {
    totalActivities,
    totalDistance,
    totalTime,
    totalCalories,
    averageDistance: totalActivities > 0 ? totalDistance / totalActivities : 0,
    averageTime: totalActivities > 0 ? totalTime / totalActivities : 0,
    averageSpeed: totalTime > 0 ? totalDistance / totalTime : 0,
  };
}

// Made with Bob
