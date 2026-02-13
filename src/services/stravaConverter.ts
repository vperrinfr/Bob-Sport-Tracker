import type { Activity, Lap, Trackpoint } from '../types/activity';
import type { StravaDetailedActivity, StravaStreamSet } from '../types/strava';
import { STRAVA_SPORT_TYPE_MAP } from '../types/strava';

/**
 * Service de conversion des données Strava vers le format Activity
 */
export class StravaConverter {
  /**
   * Convertit une activité Strava détaillée en Activity
   */
  static convertActivity(
    stravaActivity: StravaDetailedActivity,
    streams?: StravaStreamSet
  ): Activity {
    // Mapper le type de sport
    const sport = STRAVA_SPORT_TYPE_MAP[stravaActivity.sport_type] || 
                  STRAVA_SPORT_TYPE_MAP[stravaActivity.type] || 
                  'Other';

    // Créer les laps
    const laps: Lap[] = this.convertLaps(stravaActivity, streams);

    // Créer l'activité
    const activity: Activity = {
      id: `strava-${stravaActivity.id}`,
      sport,
      startTime: new Date(stravaActivity.start_date),
      totalTimeSeconds: stravaActivity.elapsed_time,
      distanceMeters: stravaActivity.distance,
      calories: stravaActivity.calories,
      notes: stravaActivity.description || stravaActivity.name,
      laps,
      creator: {
        name: 'Strava',
        version: '1.0',
        productId: 'strava-api',
      },
    };

    return activity;
  }

  /**
   * Convertit les laps Strava en Lap[]
   */
  private static convertLaps(
    stravaActivity: StravaDetailedActivity,
    streams?: StravaStreamSet
  ): Lap[] {
    // Si l'activité a des laps définis
    if (stravaActivity.laps && stravaActivity.laps.length > 0) {
      return stravaActivity.laps.map((stravaLap, index) => {
        const trackpoints = this.extractTrackpointsForLap(
          stravaLap.start_index,
          stravaLap.end_index,
          streams
        );

        return {
          startTime: new Date(stravaLap.start_date),
          totalTimeSeconds: stravaLap.elapsed_time,
          distanceMeters: stravaLap.distance,
          maximumSpeed: stravaLap.max_speed,
          calories: undefined, // Strava ne fournit pas les calories par lap
          averageHeartRate: stravaLap.average_heartrate,
          maximumHeartRate: stravaLap.max_heartrate,
          intensity: 'Active',
          cadence: stravaLap.average_cadence,
          triggerMethod: index === 0 ? 'Manual' : 'Distance',
          trackpoints,
        };
      });
    }

    // Sinon, créer un seul lap avec toute l'activité
    const trackpoints = this.convertStreamsToTrackpoints(streams);

    return [{
      startTime: new Date(stravaActivity.start_date),
      totalTimeSeconds: stravaActivity.elapsed_time,
      distanceMeters: stravaActivity.distance,
      maximumSpeed: stravaActivity.max_speed,
      calories: stravaActivity.calories,
      averageHeartRate: stravaActivity.average_heartrate,
      maximumHeartRate: stravaActivity.max_heartrate,
      intensity: 'Active',
      cadence: stravaActivity.average_cadence,
      triggerMethod: 'Manual',
      trackpoints,
    }];
  }

  /**
   * Convertit les streams Strava en Trackpoint[]
   */
  private static convertStreamsToTrackpoints(streams?: StravaStreamSet): Trackpoint[] {
    if (!streams) return [];

    const trackpoints: Trackpoint[] = [];
    const length = streams.time?.data.length || 0;

    if (length === 0) return [];

    for (let i = 0; i < length; i++) {
      const trackpoint: Trackpoint = {
        time: new Date(Date.now() + (streams.time?.data[i] || 0) * 1000),
        distance: streams.distance?.data[i],
        altitude: streams.altitude?.data[i],
        heartRate: streams.heartrate?.data[i],
        cadence: streams.cadence?.data[i],
        speed: streams.velocity_smooth?.data[i],
        power: streams.watts?.data[i],
      };

      // Ajouter les coordonnées GPS si disponibles
      if (streams.latlng?.data[i]) {
        const latlng = streams.latlng.data[i] as unknown as [number, number];
        trackpoint.latitude = latlng[0];
        trackpoint.longitude = latlng[1];
      }

      trackpoints.push(trackpoint);
    }

    return trackpoints;
  }

  /**
   * Extrait les trackpoints pour un lap spécifique
   */
  private static extractTrackpointsForLap(
    startIndex: number,
    endIndex: number,
    streams?: StravaStreamSet
  ): Trackpoint[] {
    if (!streams) return [];

    const allTrackpoints = this.convertStreamsToTrackpoints(streams);
    return allTrackpoints.slice(startIndex, endIndex + 1);
  }

  /**
   * Décode une polyline Strava en coordonnées
   * Utilise l'algorithme de décodage de polyline de Google
   */
  static decodePolyline(encoded: string): Array<[number, number]> {
    const coordinates: Array<[number, number]> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
  }

  /**
   * Crée des trackpoints basiques à partir d'une polyline
   * Utilisé quand les streams détaillés ne sont pas disponibles
   */
  static createTrackpointsFromPolyline(
    polyline: string,
    startTime: Date,
    totalTime: number,
    totalDistance: number
  ): Trackpoint[] {
    const coordinates = this.decodePolyline(polyline);
    const trackpoints: Trackpoint[] = [];

    if (coordinates.length === 0) return [];

    const timeInterval = totalTime / (coordinates.length - 1);
    const distanceInterval = totalDistance / (coordinates.length - 1);

    coordinates.forEach((coord, index) => {
      trackpoints.push({
        time: new Date(startTime.getTime() + index * timeInterval * 1000),
        latitude: coord[0],
        longitude: coord[1],
        distance: index * distanceInterval,
      });
    });

    return trackpoints;
  }

  /**
   * Calcule la vitesse moyenne en m/s
   */
  static calculateAverageSpeed(distance: number, time: number): number {
    return time > 0 ? distance / time : 0;
  }

  /**
   * Convertit la vitesse de m/s en km/h
   */
  static metersPerSecondToKmh(speed: number): number {
    return speed * 3.6;
  }

  /**
   * Convertit la vitesse de m/s en min/km (allure)
   */
  static metersPerSecondToPace(speed: number): number {
    return speed > 0 ? 1000 / (speed * 60) : 0;
  }

  /**
   * Formate une durée en secondes en HH:MM:SS
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formate une distance en mètres en km
   */
  static formatDistance(meters: number): string {
    return (meters / 1000).toFixed(2);
  }

  /**
   * Vérifie si une activité Strava a déjà été importée
   */
  static getActivityId(stravaId: number): string {
    return `strava-${stravaId}`;
  }

  /**
   * Extrait l'ID Strava d'un ID d'activité
   */
  static extractStravaId(activityId: string): number | null {
    const match = activityId.match(/^strava-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Vérifie si un ID d'activité provient de Strava
   */
  static isStravaActivity(activityId: string): boolean {
    return activityId.startsWith('strava-');
  }
}

// Made with Bob