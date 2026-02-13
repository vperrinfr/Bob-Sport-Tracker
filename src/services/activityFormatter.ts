import type { Activity, Trackpoint, Statistics } from '../types/activity';
import type { FormattedActivityData, KeyMoment } from '../types/commentary';

/**
 * Service de formatage des données d'activité pour la génération de commentaires
 * Transforme les données brutes en format optimisé pour les prompts LLM
 */

/**
 * Formate une durée en secondes en format lisible (HH:MM:SS ou MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}min ${secs.toString().padStart(2, '0')}s`;
  }
  return `${minutes}min ${secs.toString().padStart(2, '0')}s`;
}

/**
 * Formate une allure en min/km
 */
export function formatPace(speedKmh: number): string {
  if (speedKmh === 0) return 'N/A';
  const paceMinPerKm = 60 / speedKmh;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.floor((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

/**
 * Calcule les statistiques d'une activité
 */
export function calculateStatistics(activity: Activity): Statistics {
  const allTrackpoints: Trackpoint[] = activity.laps.flatMap(lap => lap.trackpoints);
  
  // Vitesses
  const speeds = allTrackpoints
    .map(tp => tp.speed)
    .filter((s): s is number => s !== undefined && s > 0);
  
  const averageSpeed = speeds.length > 0
    ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
    : 0;
  
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

  // Fréquences cardiaques
  const heartRates = allTrackpoints
    .map(tp => tp.heartRate)
    .filter((hr): hr is number => hr !== undefined && hr > 0);
  
  const averageHeartRate = heartRates.length > 0
    ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
    : undefined;
  
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : undefined;
  const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : undefined;

  // Cadences
  const cadences = allTrackpoints
    .map(tp => tp.cadence)
    .filter((c): c is number => c !== undefined && c > 0);
  
  const averageCadence = cadences.length > 0
    ? Math.round(cadences.reduce((sum, c) => sum + c, 0) / cadences.length)
    : undefined;
  
  const maxCadence = cadences.length > 0 ? Math.max(...cadences) : undefined;

  // Altitudes
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

  // Calories
  const totalCalories = activity.laps.reduce((sum, lap) => sum + (lap.calories || 0), 0);

  // Allure
  const averagePace = averageSpeed > 0 ? 60 / averageSpeed : undefined;
  const maxPace = maxSpeed > 0 ? 60 / maxSpeed : undefined;

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
    totalCalories: totalCalories > 0 ? totalCalories : undefined,
    elevationGain: elevationGain > 1 ? Math.round(elevationGain) : undefined,
    elevationLoss: elevationLoss > 1 ? Math.round(elevationLoss) : undefined,
    minAltitude,
    maxAltitude,
    averagePace,
    maxPace,
  };
}

/**
 * Détecte les moments clés d'une activité
 */
export function detectKeyMoments(activity: Activity, stats: Statistics): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const allTrackpoints: Trackpoint[] = activity.laps.flatMap(lap => lap.trackpoints);

  // Moment de départ
  moments.push({
    type: 'start',
    timestamp: 0,
    description: 'Départ de l\'activité',
    importance: 5,
  });

  // Meilleur temps au kilomètre (analyse par segments de 1km)
  if (stats.maxSpeed > 0) {
    let bestSegmentSpeed = 0;
    let bestSegmentTime = 0;
    let currentSegmentStart = 0;

    for (let i = 0; i < allTrackpoints.length; i++) {
      const tp = allTrackpoints[i];
      if (tp.distance && tp.distance - currentSegmentStart >= 1000) {
        const segmentTime = (tp.time.getTime() - allTrackpoints[0].time.getTime()) / 1000;
        const segmentSpeed = tp.speed || 0;
        
        if (segmentSpeed > bestSegmentSpeed) {
          bestSegmentSpeed = segmentSpeed;
          bestSegmentTime = segmentTime;
        }
        
        currentSegmentStart = tp.distance;
      }
    }

    if (bestSegmentSpeed > 0) {
      moments.push({
        type: 'best_pace',
        timestamp: bestSegmentTime,
        description: `Meilleur temps au kilomètre`,
        value: bestSegmentSpeed,
        unit: 'km/h',
        importance: 4,
      });
    }
  }

  // Pic de fréquence cardiaque
  if (stats.maxHeartRate) {
    const maxHrTrackpoint = allTrackpoints.find(tp => tp.heartRate === stats.maxHeartRate);
    if (maxHrTrackpoint) {
      const timestamp = (maxHrTrackpoint.time.getTime() - allTrackpoints[0].time.getTime()) / 1000;
      moments.push({
        type: 'heart_rate_peak',
        timestamp,
        description: `Pic de fréquence cardiaque`,
        value: stats.maxHeartRate,
        unit: 'bpm',
        importance: 3,
      });
    }
  }

  // Montées importantes (dénivelé > 50m)
  if (stats.elevationGain && stats.elevationGain > 50) {
    const midpoint = allTrackpoints.length / 2;
    const midpointTime = (allTrackpoints[Math.floor(midpoint)].time.getTime() - allTrackpoints[0].time.getTime()) / 1000;
    
    moments.push({
      type: 'elevation_gain',
      timestamp: midpointTime,
      description: `Montée importante`,
      value: stats.elevationGain,
      unit: 'm',
      importance: 3,
    });
  }

  // Jalons de distance (5km, 10km, etc.)
  const milestones = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
  for (const milestone of milestones) {
    if (stats.totalDistance >= milestone) {
      const milestoneTrackpoint = allTrackpoints.find(tp => tp.distance && tp.distance >= milestone);
      if (milestoneTrackpoint) {
        const timestamp = (milestoneTrackpoint.time.getTime() - allTrackpoints[0].time.getTime()) / 1000;
        moments.push({
          type: 'milestone',
          timestamp,
          description: `${milestone / 1000}km parcourus`,
          value: milestone / 1000,
          unit: 'km',
          importance: 2,
        });
      }
    }
  }

  // Arrivée
  moments.push({
    type: 'finish',
    timestamp: stats.totalTime,
    description: 'Arrivée',
    importance: 5,
  });

  // Trier par timestamp
  return moments.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Formate les données d'activité pour la génération de commentaires
 */
export function formatActivityForCommentary(activity: Activity): FormattedActivityData {
  const stats = calculateStatistics(activity);
  const keyMoments = detectKeyMoments(activity, stats);

  return {
    sport: activity.sport,
    distance: Math.round(stats.totalDistance / 10) / 100, // Convertir en km avec 2 décimales
    duration: formatDuration(stats.totalTime),
    averagePace: stats.averageSpeed > 0 ? formatPace(stats.averageSpeed) : undefined,
    averageSpeed: Math.round(stats.averageSpeed * 10) / 10,
    maxSpeed: Math.round(stats.maxSpeed * 10) / 10,
    averageHeartRate: stats.averageHeartRate,
    maxHeartRate: stats.maxHeartRate,
    elevationGain: stats.elevationGain,
    elevationLoss: stats.elevationLoss,
    calories: stats.totalCalories,
    keyMoments,
  };
}

/**
 * Génère un résumé textuel des données d'activité
 */
export function generateActivitySummary(data: FormattedActivityData): string {
  const parts: string[] = [];

  // Sport et distance
  parts.push(`${data.sport} de ${data.distance} km`);

  // Durée
  parts.push(`en ${data.duration}`);

  // Allure moyenne
  if (data.averagePace) {
    parts.push(`à une allure moyenne de ${data.averagePace}`);
  }

  // Fréquence cardiaque
  if (data.averageHeartRate) {
    parts.push(`avec une FC moyenne de ${data.averageHeartRate} bpm`);
  }

  // Dénivelé
  if (data.elevationGain && data.elevationGain > 10) {
    parts.push(`et ${data.elevationGain}m de dénivelé positif`);
  }

  return parts.join(' ');
}

/**
 * Génère une description détaillée des moments clés
 */
export function generateKeyMomentsDescription(moments: KeyMoment[]): string {
  const descriptions: string[] = [];

  for (const moment of moments) {
    switch (moment.type) {
      case 'best_pace':
        if (moment.value) {
          descriptions.push(`Meilleur temps au km: ${formatPace(moment.value)} (à ${formatDuration(moment.timestamp)})`);
        }
        break;
      case 'heart_rate_peak':
        if (moment.value) {
          descriptions.push(`Pic de FC: ${moment.value} bpm (à ${formatDuration(moment.timestamp)})`);
        }
        break;
      case 'elevation_gain':
        if (moment.value) {
          descriptions.push(`Montée de ${moment.value}m`);
        }
        break;
      case 'milestone':
        if (moment.value) {
          descriptions.push(`${moment.value}km atteints en ${formatDuration(moment.timestamp)}`);
        }
        break;
    }
  }

  return descriptions.join(', ');
}

/**
 * Extrait les points forts d'une activité
 */
export function extractHighlights(data: FormattedActivityData): string[] {
  const highlights: string[] = [];

  // Distance significative
  if (data.distance >= 10) {
    highlights.push(`Distance impressionnante de ${data.distance}km`);
  }

  // Vitesse élevée
  if (data.averageSpeed >= 12) {
    highlights.push(`Excellente vitesse moyenne de ${data.averageSpeed} km/h`);
  }

  // Dénivelé important
  if (data.elevationGain && data.elevationGain >= 100) {
    highlights.push(`Défi relevé avec ${data.elevationGain}m de dénivelé`);
  }

  // Fréquence cardiaque dans la zone
  if (data.averageHeartRate && data.averageHeartRate >= 140 && data.averageHeartRate <= 170) {
    highlights.push(`Effort soutenu avec une FC moyenne de ${data.averageHeartRate} bpm`);
  }

  // Calories brûlées
  if (data.calories && data.calories >= 500) {
    highlights.push(`${data.calories} calories brûlées`);
  }

  return highlights;
}

/**
 * Génère des suggestions d'amélioration basées sur les données
 */
export function generateImprovementSuggestions(data: FormattedActivityData): string[] {
  const suggestions: string[] = [];

  // Suggestions basées sur la vitesse
  if (data.averageSpeed < 10 && data.sport.toLowerCase().includes('running')) {
    suggestions.push('Essaie d\'augmenter progressivement ton allure sur les prochaines sorties');
  }

  // Suggestions basées sur la distance
  if (data.distance < 5) {
    suggestions.push('Pourquoi ne pas viser 5km la prochaine fois ?');
  }

  // Suggestions basées sur le dénivelé
  if (!data.elevationGain || data.elevationGain < 50) {
    suggestions.push('Intègre quelques montées pour varier l\'entraînement');
  }

  return suggestions;
}

// Made with ❤️ by Bob

// Made with Bob
