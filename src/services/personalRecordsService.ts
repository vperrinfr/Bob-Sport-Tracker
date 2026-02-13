// Service pour la gestion des records personnels

import type { Activity } from '../types/activity';
import type {
  PersonalRecord,
  RecordType,
  RecordCategory,
  RecordsByCategory,
  RecordStatistics,
  RecordDetectionResult,
} from '../types/records';
import {
  RECORD_TYPE_LABELS,
  RECORD_CATEGORY_ICONS,
  RECORD_CATEGORY_DESCRIPTIONS,
} from '../types/records';
import {
  detectRecords,
  createRecordFromDetection,
  compareToRecord,
  getDistanceCategory,
} from '../utils/recordDetection';
import { db } from './database';
import Dexie from 'dexie';

/**
 * Extension de la base de données pour les records
 */
class RecordsDatabase extends Dexie {
  records!: Dexie.Table<PersonalRecord, string>;

  constructor() {
    super('SportActivityTracker');
    
    // Mise à jour du schéma pour inclure les records
    this.version(2).stores({
      activities: 'id, sport, startTime, distanceMeters, totalTimeSeconds',
      records: 'id, type, category, sport, activityDate',
    });
  }
}

// Instance de la base de données avec records
const recordsDb = new RecordsDatabase();

/**
 * Service de gestion des records personnels
 */
export class PersonalRecordsService {
  /**
   * Détecte et sauvegarde les nouveaux records pour une activité
   */
  static async detectAndSaveRecords(activity: Activity): Promise<PersonalRecord[]> {
    try {
      // Récupérer les records existants pour ce sport
      const existingRecords = await this.getRecordsBySport(activity.sport);
      
      // Détecter les nouveaux records
      const detections = detectRecords(activity, existingRecords);
      
      // Créer et sauvegarder les nouveaux records
      const newRecords: PersonalRecord[] = [];
      
      for (const detection of detections) {
        if (detection.isRecord) {
          const record = createRecordFromDetection(detection, activity);
          await recordsDb.records.put(record);
          newRecords.push(record);
        }
      }
      
      return newRecords;
    } catch (error) {
      console.error('Erreur lors de la détection des records:', error);
      throw new Error('Impossible de détecter les records');
    }
  }
  
  /**
   * Récupère tous les records
   */
  static async getAllRecords(): Promise<PersonalRecord[]> {
    try {
      return await recordsDb.records.orderBy('activityDate').reverse().toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des records:', error);
      return [];
    }
  }
  
  /**
   * Récupère les records par sport
   */
  static async getRecordsBySport(sport: string): Promise<PersonalRecord[]> {
    try {
      return await recordsDb.records.where('sport').equals(sport).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des records par sport:', error);
      return [];
    }
  }
  
  /**
   * Récupère les records par type
   */
  static async getRecordsByType(type: RecordType): Promise<PersonalRecord[]> {
    try {
      return await recordsDb.records.where('type').equals(type).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des records par type:', error);
      return [];
    }
  }
  
  /**
   * Récupère les records par catégorie
   */
  static async getRecordsByCategory(category: RecordCategory): Promise<PersonalRecord[]> {
    try {
      return await recordsDb.records.where('category').equals(category).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des records par catégorie:', error);
      return [];
    }
  }
  
  /**
   * Récupère un record spécifique
   */
  static async getRecord(id: string): Promise<PersonalRecord | undefined> {
    try {
      return await recordsDb.records.get(id);
    } catch (error) {
      console.error('Erreur lors de la récupération du record:', error);
      return undefined;
    }
  }
  
  /**
   * Supprime un record
   */
  static async deleteRecord(id: string): Promise<void> {
    try {
      await recordsDb.records.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression du record:', error);
      throw new Error('Impossible de supprimer le record');
    }
  }
  
  /**
   * Supprime tous les records d'une activité
   */
  static async deleteRecordsByActivity(activityId: string): Promise<void> {
    try {
      const records = await recordsDb.records.where('activityId').equals(activityId).toArray();
      const ids = records.map(r => r.id);
      await recordsDb.records.bulkDelete(ids);
    } catch (error) {
      console.error('Erreur lors de la suppression des records:', error);
      throw new Error('Impossible de supprimer les records');
    }
  }
  
  /**
   * Marque les records comme vus (retire le badge "nouveau")
   */
  static async markRecordsAsSeen(recordIds: string[]): Promise<void> {
    try {
      for (const id of recordIds) {
        const record = await recordsDb.records.get(id);
        if (record) {
          record.isNew = false;
          await recordsDb.records.put(record);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des records:', error);
    }
  }
  
  /**
   * Récupère les records récents (nouveaux)
   */
  static async getNewRecords(): Promise<PersonalRecord[]> {
    try {
      const allRecords = await this.getAllRecords();
      return allRecords.filter(r => r.isNew === true);
    } catch (error) {
      console.error('Erreur lors de la récupération des nouveaux records:', error);
      return [];
    }
  }
  
  /**
   * Organise les records par catégorie
   */
  static async getRecordsGroupedByCategory(): Promise<RecordsByCategory[]> {
    try {
      const allRecords = await this.getAllRecords();
      const grouped = new Map<RecordCategory, PersonalRecord[]>();
      
      allRecords.forEach(record => {
        if (!grouped.has(record.category)) {
          grouped.set(record.category, []);
        }
        grouped.get(record.category)!.push(record);
      });
      
      const result: RecordsByCategory[] = [];
      
      grouped.forEach((records, category) => {
        result.push({
          category,
          label: this.getCategoryLabel(category),
          description: RECORD_CATEGORY_DESCRIPTIONS[category],
          records: records.sort((a, b) => 
            new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
          ),
          icon: RECORD_CATEGORY_ICONS[category],
        });
      });
      
      return result.sort((a, b) => b.records.length - a.records.length);
    } catch (error) {
      console.error('Erreur lors du groupement des records:', error);
      return [];
    }
  }
  
  /**
   * Obtient le label d'une catégorie
   */
  private static getCategoryLabel(category: RecordCategory): string {
    const labels: Record<RecordCategory, string> = {
      '1km': '1 km',
      '5km': '5 km',
      '10km': '10 km',
      'halfMarathon': 'Semi-marathon',
      'marathon': 'Marathon',
      'longest': 'Plus longue distance',
      'fastest': 'Plus rapide',
      'highest': 'Plus haut dénivelé',
    };
    return labels[category];
  }
  
  /**
   * Calcule les statistiques des records
   */
  static async getRecordStatistics(): Promise<RecordStatistics> {
    try {
      const allRecords = await this.getAllRecords();
      
      const recordsBySport: Record<string, number> = {};
      const recordsByType: Record<RecordType, number> = {
        distance: 0,
        speed: 0,
        pace: 0,
        time: 0,
        elevation: 0,
        calories: 0,
        heartRate: 0,
      };
      
      allRecords.forEach(record => {
        // Par sport
        recordsBySport[record.sport] = (recordsBySport[record.sport] || 0) + 1;
        
        // Par type
        recordsByType[record.type]++;
      });
      
      // Records récents (5 derniers)
      const recentRecords = allRecords
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      // Dernière date de record
      const lastRecordDate = allRecords.length > 0
        ? new Date(Math.max(...allRecords.map(r => new Date(r.createdAt).getTime())))
        : undefined;
      
      return {
        totalRecords: allRecords.length,
        recordsBySport,
        recordsByType,
        recentRecords,
        longestStreak: 0, // TODO: Implémenter le calcul de série
        lastRecordDate,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalRecords: 0,
        recordsBySport: {},
        recordsByType: {
          distance: 0,
          speed: 0,
          pace: 0,
          time: 0,
          elevation: 0,
          calories: 0,
          heartRate: 0,
        },
        recentRecords: [],
        longestStreak: 0,
      };
    }
  }
  
  /**
   * Compare une activité avec les records existants
   */
  static async compareActivityToRecords(activity: Activity): Promise<{
    category: RecordCategory | null;
    record: PersonalRecord | null;
    comparison: ReturnType<typeof compareToRecord> | null;
  }> {
    try {
      const category = getDistanceCategory(activity.distanceMeters);
      
      if (!category) {
        return { category: null, record: null, comparison: null };
      }
      
      const records = await this.getRecordsByCategory(category);
      const sportRecord = records.find(r => r.sport === activity.sport && r.type === 'time');
      
      if (!sportRecord) {
        return { category, record: null, comparison: null };
      }
      
      const comparison = compareToRecord(activity, sportRecord);
      
      return { category, record: sportRecord, comparison };
    } catch (error) {
      console.error('Erreur lors de la comparaison:', error);
      return { category: null, record: null, comparison: null };
    }
  }
  
  /**
   * Recalcule tous les records (utile après suppression d'activités)
   */
  static async recalculateAllRecords(activities: Activity[]): Promise<void> {
    try {
      // Supprimer tous les records existants
      await recordsDb.records.clear();
      
      // Recalculer pour chaque activité
      for (const activity of activities) {
        await this.detectAndSaveRecords(activity);
      }
    } catch (error) {
      console.error('Erreur lors du recalcul des records:', error);
      throw new Error('Impossible de recalculer les records');
    }
  }
  
  /**
   * Exporte les records en JSON
   */
  static async exportRecords(): Promise<string> {
    try {
      const records = await this.getAllRecords();
      return JSON.stringify(records, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'export des records:', error);
      throw new Error('Impossible d\'exporter les records');
    }
  }
  
  /**
   * Importe des records depuis JSON
   */
  static async importRecords(jsonData: string): Promise<number> {
    try {
      const records: PersonalRecord[] = JSON.parse(jsonData);
      
      let imported = 0;
      for (const record of records) {
        await recordsDb.records.put(record);
        imported++;
      }
      
      return imported;
    } catch (error) {
      console.error('Erreur lors de l\'import des records:', error);
      throw new Error('Impossible d\'importer les records');
    }
  }
}

// Made with Bob