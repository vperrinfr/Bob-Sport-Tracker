import Dexie, { type Table } from 'dexie';
import type { Activity } from '../types/activity';

/**
 * Base de données IndexedDB pour stocker les activités
 */
export class ActivityDatabase extends Dexie {
  activities!: Table<Activity, string>;

  constructor() {
    super('SportActivityTracker');
    
    this.version(1).stores({
      activities: 'id, sport, startTime, distanceMeters, totalTimeSeconds',
    });
  }
}

// Instance singleton de la base de données
export const db = new ActivityDatabase();

/**
 * Service de gestion des activités dans IndexedDB
 */
export class ActivityService {
  /**
   * Ajoute une nouvelle activité
   */
  static async addActivity(activity: Activity): Promise<string> {
    try {
      await db.activities.add(activity);
      return activity.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'activité:', error);
      throw new Error('Impossible d\'ajouter l\'activité');
    }
  }

  /**
   * Récupère toutes les activités
   */
  static async getAllActivities(): Promise<Activity[]> {
    try {
      return await db.activities.orderBy('startTime').reverse().toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      throw new Error('Impossible de récupérer les activités');
    }
  }

  /**
   * Récupère une activité par son ID
   */
  static async getActivityById(id: string): Promise<Activity | undefined> {
    try {
      return await db.activities.get(id);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      throw new Error('Impossible de récupérer l\'activité');
    }
  }

  /**
   * Met à jour une activité
   */
  static async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    try {
      await db.activities.update(id, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'activité:', error);
      throw new Error('Impossible de mettre à jour l\'activité');
    }
  }

  /**
   * Supprime une activité
   */
  static async deleteActivity(id: string): Promise<void> {
    try {
      await db.activities.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'activité:', error);
      throw new Error('Impossible de supprimer l\'activité');
    }
  }

  /**
   * Supprime toutes les activités
   */
  static async deleteAllActivities(): Promise<void> {
    try {
      await db.activities.clear();
    } catch (error) {
      console.error('Erreur lors de la suppression des activités:', error);
      throw new Error('Impossible de supprimer les activités');
    }
  }

  /**
   * Recherche des activités par sport
   */
  static async getActivitiesBySport(sport: string): Promise<Activity[]> {
    try {
      return await db.activities.where('sport').equals(sport).toArray();
    } catch (error) {
      console.error('Erreur lors de la recherche par sport:', error);
      throw new Error('Impossible de rechercher les activités');
    }
  }

  /**
   * Recherche des activités par plage de dates
   */
  static async getActivitiesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Activity[]> {
    try {
      return await db.activities
        .where('startTime')
        .between(startDate, endDate, true, true)
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la recherche par date:', error);
      throw new Error('Impossible de rechercher les activités');
    }
  }

  /**
   * Filtre les activités selon plusieurs critères
   */
  static async filterActivities(filters: {
    sport?: string;
    startDate?: Date;
    endDate?: Date;
    minDistance?: number;
    maxDistance?: number;
    minDuration?: number;
    maxDuration?: number;
    searchQuery?: string;
  }): Promise<Activity[]> {
    try {
      let activities = await db.activities.toArray();

      // Filtrer par sport
      if (filters.sport) {
        activities = activities.filter(a => a.sport === filters.sport);
      }

      // Filtrer par plage de dates
      if (filters.startDate) {
        activities = activities.filter(a => a.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        activities = activities.filter(a => a.startTime <= filters.endDate!);
      }

      // Filtrer par distance
      if (filters.minDistance !== undefined) {
        activities = activities.filter(a => a.distanceMeters >= filters.minDistance!);
      }
      if (filters.maxDistance !== undefined) {
        activities = activities.filter(a => a.distanceMeters <= filters.maxDistance!);
      }

      // Filtrer par durée
      if (filters.minDuration !== undefined) {
        activities = activities.filter(a => a.totalTimeSeconds >= filters.minDuration!);
      }
      if (filters.maxDuration !== undefined) {
        activities = activities.filter(a => a.totalTimeSeconds <= filters.maxDuration!);
      }

      // Recherche textuelle dans les notes
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        activities = activities.filter(a => 
          a.notes?.toLowerCase().includes(query) ||
          a.sport.toLowerCase().includes(query)
        );
      }

      return activities;
    } catch (error) {
      console.error('Erreur lors du filtrage des activités:', error);
      throw new Error('Impossible de filtrer les activités');
    }
  }

  /**
   * Compte le nombre total d'activités
   */
  static async countActivities(): Promise<number> {
    try {
      return await db.activities.count();
    } catch (error) {
      console.error('Erreur lors du comptage des activités:', error);
      return 0;
    }
  }

  /**
   * Vérifie si une activité existe déjà
   */
  static async activityExists(id: string): Promise<boolean> {
    try {
      const activity = await db.activities.get(id);
      return !!activity;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'activité:', error);
      return false;
    }
  }

  /**
   * Exporte toutes les activités en JSON
   */
  static async exportAllActivities(): Promise<string> {
    try {
      const activities = await db.activities.toArray();
      return JSON.stringify(activities, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'export des activités:', error);
      throw new Error('Impossible d\'exporter les activités');
    }
  }

  /**
   * Importe des activités depuis JSON
   */
  static async importActivities(jsonData: string): Promise<number> {
    try {
      const activities: Activity[] = JSON.parse(jsonData);
      
      // Convertir les dates string en objets Date
      activities.forEach(activity => {
        activity.startTime = new Date(activity.startTime);
        activity.laps.forEach(lap => {
          lap.startTime = new Date(lap.startTime);
          lap.trackpoints.forEach(tp => {
            tp.time = new Date(tp.time);
          });
        });
      });

      await db.activities.bulkAdd(activities);
      return activities.length;
    } catch (error) {
      console.error('Erreur lors de l\'import des activités:', error);
      throw new Error('Impossible d\'importer les activités');
    }
  }
}

// Made with Bob
