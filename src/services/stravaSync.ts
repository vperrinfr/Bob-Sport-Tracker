import type { 
  StravaActivity, 
  StravaDetailedActivity, 
  StravaStreamSet,
  StravaSyncOptions,
  StravaSyncResult 
} from '../types/strava';
import type { Activity } from '../types/activity';
import { StravaAuthService } from './stravaAuth';
import { StravaConverter } from './stravaConverter';
import { ActivityService } from './database';

/**
 * Service de synchronisation des activités Strava
 */
export class StravaSyncService {
  /**
   * Récupère la liste des activités depuis Strava
   */
  static async fetchActivities(options: StravaSyncOptions = {}): Promise<StravaActivity[]> {
    const params = new URLSearchParams();
    
    if (options.before) params.append('before', options.before.toString());
    if (options.after) params.append('after', options.after.toString());
    if (options.page) params.append('page', options.page.toString());
    params.append('per_page', (options.limit || 30).toString());

    const endpoint = `/athlete/activities?${params.toString()}`;
    return StravaAuthService.apiRequest<StravaActivity[]>(endpoint);
  }

  /**
   * Récupère les détails d'une activité spécifique
   */
  static async fetchActivityDetails(activityId: number): Promise<StravaDetailedActivity> {
    const endpoint = `/activities/${activityId}`;
    return StravaAuthService.apiRequest<StravaDetailedActivity>(endpoint);
  }

  /**
   * Récupère les streams (données détaillées) d'une activité
   */
  static async fetchActivityStreams(activityId: number): Promise<StravaStreamSet> {
    const streamTypes = [
      'time',
      'distance',
      'latlng',
      'altitude',
      'velocity_smooth',
      'heartrate',
      'cadence',
      'watts',
      'temp',
      'moving',
      'grade_smooth',
    ];

    const endpoint = `/activities/${activityId}/streams?keys=${streamTypes.join(',')}&key_by_type=true`;
    
    try {
      const streams = await StravaAuthService.apiRequest<StravaStreamSet>(endpoint);
      return streams;
    } catch (error) {
      console.warn('Impossible de récupérer les streams pour l\'activité', activityId, error);
      return {};
    }
  }

  /**
   * Synchronise une activité Strava spécifique
   */
  static async syncActivity(stravaId: number): Promise<Activity> {
    // Vérifier si l'activité existe déjà
    const activityId = StravaConverter.getActivityId(stravaId);
    const exists = await ActivityService.activityExists(activityId);

    if (exists) {
      const existing = await ActivityService.getActivityById(activityId);
      if (existing) {
        return existing;
      }
    }

    // Récupérer les détails de l'activité
    const stravaActivity = await this.fetchActivityDetails(stravaId);

    // Récupérer les streams (données GPS, fréquence cardiaque, etc.)
    const streams = await this.fetchActivityStreams(stravaId);

    // Convertir en format Activity
    const activity = StravaConverter.convertActivity(stravaActivity, streams);

    // Si pas de trackpoints détaillés mais qu'il y a une polyline, l'utiliser
    if (activity.laps[0].trackpoints.length === 0 && stravaActivity.map?.summary_polyline) {
      const trackpoints = StravaConverter.createTrackpointsFromPolyline(
        stravaActivity.map.summary_polyline,
        activity.startTime,
        activity.totalTimeSeconds,
        activity.distanceMeters
      );
      activity.laps[0].trackpoints = trackpoints;
    }

    // Sauvegarder dans la base de données
    await ActivityService.addActivity(activity);

    return activity;
  }

  /**
   * Synchronise plusieurs activités
   */
  static async syncActivities(options: StravaSyncOptions = {}): Promise<StravaSyncResult> {
    const result: StravaSyncResult = {
      success: true,
      activitiesImported: 0,
      activitiesSkipped: 0,
      errors: [],
    };

    try {
      // Récupérer la liste des activités
      const activities = await this.fetchActivities(options);

      console.log(`${activities.length} activités trouvées sur Strava`);

      // Synchroniser chaque activité
      for (const stravaActivity of activities) {
        try {
          const activityId = StravaConverter.getActivityId(stravaActivity.id);
          const exists = await ActivityService.activityExists(activityId);

          if (exists) {
            console.log(`Activité ${stravaActivity.id} déjà importée, ignorée`);
            result.activitiesSkipped++;
            continue;
          }

          console.log(`Synchronisation de l'activité ${stravaActivity.id}...`);
          await this.syncActivity(stravaActivity.id);
          result.activitiesImported++;

          // Petite pause pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error(`Erreur lors de la synchronisation de l'activité ${stravaActivity.id}:`, error);
          result.errors.push(`Activité ${stravaActivity.id}: ${errorMessage}`);
        }
      }

      // Mettre à jour la date de dernière synchronisation
      await StravaAuthService.updateLastSync();

      result.success = result.errors.length === 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de la synchronisation:', error);
      result.errors.push(errorMessage);
      result.success = false;
    }

    return result;
  }

  /**
   * Synchronise les activités récentes (30 derniers jours)
   */
  static async syncRecentActivities(): Promise<StravaSyncResult> {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    return this.syncActivities({
      after: thirtyDaysAgo,
      limit: 50,
    });
  }

  /**
   * Synchronise toutes les activités depuis une date
   */
  static async syncActivitiesSince(date: Date): Promise<StravaSyncResult> {
    const timestamp = Math.floor(date.getTime() / 1000);
    
    return this.syncActivities({
      after: timestamp,
      limit: 200,
    });
  }

  /**
   * Synchronise toutes les activités (par pages)
   */
  static async syncAllActivities(
    onProgress?: (current: number, total: number) => void
  ): Promise<StravaSyncResult> {
    const result: StravaSyncResult = {
      success: true,
      activitiesImported: 0,
      activitiesSkipped: 0,
      errors: [],
    };

    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;

    try {
      while (hasMore) {
        const activities = await this.fetchActivities({
          page,
          limit: 50,
        });

        if (activities.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Page ${page}: ${activities.length} activités`);

        for (const stravaActivity of activities) {
          try {
            const activityId = StravaConverter.getActivityId(stravaActivity.id);
            const exists = await ActivityService.activityExists(activityId);

            if (exists) {
              result.activitiesSkipped++;
            } else {
              await this.syncActivity(stravaActivity.id);
              result.activitiesImported++;
            }

            totalProcessed++;
            if (onProgress) {
              onProgress(totalProcessed, totalProcessed + activities.length);
            }

            // Pause pour éviter de surcharger l'API
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            console.error(`Erreur lors de la synchronisation de l'activité ${stravaActivity.id}:`, error);
            result.errors.push(`Activité ${stravaActivity.id}: ${errorMessage}`);
          }
        }

        page++;

        // Strava limite à 200 activités par requête
        if (activities.length < 50) {
          hasMore = false;
        }
      }

      await StravaAuthService.updateLastSync();
      result.success = result.errors.length === 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de la synchronisation complète:', error);
      result.errors.push(errorMessage);
      result.success = false;
    }

    return result;
  }

  /**
   * Compte le nombre d'activités Strava dans la base de données
   */
  static async countStravaActivities(): Promise<number> {
    const allActivities = await ActivityService.getAllActivities();
    return allActivities.filter(a => StravaConverter.isStravaActivity(a.id)).length;
  }

  /**
   * Supprime toutes les activités Strava de la base de données
   */
  static async deleteAllStravaActivities(): Promise<number> {
    const allActivities = await ActivityService.getAllActivities();
    const stravaActivities = allActivities.filter(a => StravaConverter.isStravaActivity(a.id));

    for (const activity of stravaActivities) {
      await ActivityService.deleteActivity(activity.id);
    }

    return stravaActivities.length;
  }

  /**
   * Vérifie si de nouvelles activités sont disponibles sur Strava
   */
  static async checkForNewActivities(): Promise<number> {
    const authState = await StravaAuthService.getAuthState();
    
    const after = authState.lastSync 
      ? Math.floor(authState.lastSync.getTime() / 1000)
      : Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 jours par défaut

    const activities = await this.fetchActivities({
      after,
      limit: 50,
    });

    // Compter combien ne sont pas encore importées
    let newCount = 0;
    for (const activity of activities) {
      const activityId = StravaConverter.getActivityId(activity.id);
      const exists = await ActivityService.activityExists(activityId);
      if (!exists) {
        newCount++;
      }
    }

    return newCount;
  }
}

// Made with Bob