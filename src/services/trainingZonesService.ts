// Service pour la gestion des zones d'entraînement

import type { Activity } from '../types/activity';
import type {
  ZoneThresholds,
  ZoneAnalysis,
  ZoneDistribution,
  ZonePercentages,
  ZoneSettings,
  ZoneNumber,
  HeartRateZone,
  TrainingType,
} from '../types/trainingZones';
import {
  defineZones,
  calculateTimeInZones,
  calculateZonePercentages,
  getDominantZone,
  determineTrainingType,
  calculateTrainingEfficiency,
  calculateMaxHRFromAge,
} from '../utils/zoneCalculations';

/**
 * Service de gestion des zones d'entraînement
 */
export class TrainingZonesService {
  private static readonly STORAGE_KEY = 'training_zones_settings';
  
  /**
   * Obtient les paramètres de zones sauvegardés
   */
  static getSettings(): ZoneSettings | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const settings = JSON.parse(stored);
      // Convertir les dates
      settings.createdAt = new Date(settings.createdAt);
      settings.updatedAt = new Date(settings.updatedAt);
      
      return settings;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de zones:', error);
      return null;
    }
  }
  
  /**
   * Sauvegarde les paramètres de zones
   */
  static saveSettings(settings: Omit<ZoneSettings, 'id' | 'createdAt' | 'updatedAt'>): ZoneSettings {
    const existingSettings = this.getSettings();
    
    const newSettings: ZoneSettings = {
      id: existingSettings?.id || 'default',
      ...settings,
      createdAt: existingSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    return newSettings;
  }
  
  /**
   * Obtient les zones d'entraînement configurées
   */
  static getZones(): HeartRateZone[] {
    const settings = this.getSettings();
    
    if (!settings) {
      // Paramètres par défaut : âge 30 ans
      const defaultMaxHR = calculateMaxHRFromAge(30);
      return defineZones(defaultMaxHR, undefined, 'age');
    }
    
    if (settings.customZones && settings.customZones.length > 0) {
      return settings.customZones;
    }
    
    return defineZones(
      settings.maxHeartRate,
      settings.restingHeartRate,
      settings.method
    );
  }
  
  /**
   * Configure les zones basées sur l'âge
   */
  static configureByAge(age: number): ZoneSettings {
    const maxHR = calculateMaxHRFromAge(age);
    
    return this.saveSettings({
      maxHeartRate: maxHR,
      method: 'age',
      age,
    });
  }
  
  /**
   * Configure les zones avec la méthode Karvonen
   */
  static configureByKarvonen(age: number, restingHR: number): ZoneSettings {
    const maxHR = calculateMaxHRFromAge(age);
    
    return this.saveSettings({
      maxHeartRate: maxHR,
      restingHeartRate: restingHR,
      method: 'karvonen',
      age,
    });
  }
  
  /**
   * Configure les zones manuellement
   */
  static configureManually(maxHR: number, customZones?: HeartRateZone[]): ZoneSettings {
    return this.saveSettings({
      maxHeartRate: maxHR,
      method: 'manual',
      customZones,
    });
  }
  
  /**
   * Analyse une activité pour déterminer les zones
   */
  static analyzeActivity(activity: Activity): ZoneAnalysis {
    const zones = this.getZones();
    const distribution = calculateTimeInZones(activity, zones);
    const percentages = calculateZonePercentages(distribution);
    const dominantZone = getDominantZone(distribution);
    const trainingType = determineTrainingType(percentages);
    const efficiency = calculateTrainingEfficiency(percentages, trainingType);
    const recommendations = this.generateRecommendations(percentages, trainingType, efficiency);
    
    return {
      distribution,
      percentages,
      dominantZone,
      recommendations,
      trainingType,
      efficiency,
    };
  }
  
  /**
   * Génère des recommandations basées sur l'analyse
   */
  private static generateRecommendations(
    percentages: ZonePercentages,
    trainingType: TrainingType,
    efficiency: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur le type d'entraînement
    switch (trainingType) {
      case 'recovery':
        recommendations.push('✅ Excellente séance de récupération');
        if (percentages.zone3 + percentages.zone4 + percentages.zone5 > 20) {
          recommendations.push('⚠️ Intensité un peu élevée pour une récupération');
        }
        break;
        
      case 'endurance':
        recommendations.push('✅ Bonne séance d\'endurance de base');
        if (percentages.zone2 < 60) {
          recommendations.push('💡 Essayez de rester plus longtemps en Zone 2');
        }
        break;
        
      case 'tempo':
        recommendations.push('✅ Séance tempo bien exécutée');
        if (percentages.zone3 < 50) {
          recommendations.push('💡 Augmentez le temps en Zone 3 pour plus d\'efficacité');
        }
        break;
        
      case 'threshold':
        recommendations.push('✅ Travail au seuil lactique');
        if (percentages.zone5 > 15) {
          recommendations.push('⚠️ Attention à ne pas trop monter en Zone 5');
        }
        break;
        
      case 'interval':
        recommendations.push('✅ Séance d\'intervalles intenses');
        recommendations.push('💡 Pensez à bien récupérer après cette séance');
        break;
        
      case 'mixed':
        recommendations.push('📊 Séance variée avec différentes intensités');
        break;
        
      case 'unknown':
        if (percentages.unknown > 50) {
          recommendations.push('⚠️ Données de fréquence cardiaque insuffisantes');
        }
        break;
    }
    
    // Recommandations basées sur l'efficacité
    if (efficiency >= 80) {
      recommendations.push('🎯 Excellente répartition des zones');
    } else if (efficiency >= 60) {
      recommendations.push('👍 Bonne répartition des zones');
    } else if (efficiency >= 40) {
      recommendations.push('💡 Répartition à améliorer');
    } else {
      recommendations.push('⚠️ Répartition des zones à revoir');
    }
    
    // Recommandations spécifiques
    if (percentages.zone5 > 30) {
      recommendations.push('⚠️ Beaucoup de temps en Zone 5 - Risque de surentraînement');
    }
    
    if (percentages.zone1 > 70 && trainingType !== 'recovery') {
      recommendations.push('💡 Intensité très faible - Augmentez le rythme');
    }
    
    if (percentages.zone2 > 80 && trainingType === 'endurance') {
      recommendations.push('✅ Parfait pour développer l\'endurance de base');
    }
    
    return recommendations;
  }
  
  /**
   * Obtient les statistiques de zones pour plusieurs activités
   */
  static getZoneStatistics(activities: Activity[]): {
    totalTimeByZone: ZoneDistribution;
    averagePercentages: ZonePercentages;
    trainingTypeDistribution: Record<TrainingType, number>;
    averageEfficiency: number;
  } {
    const zones = this.getZones();
    
    const totalTimeByZone: ZoneDistribution = {
      zone1: 0,
      zone2: 0,
      zone3: 0,
      zone4: 0,
      zone5: 0,
      unknown: 0,
    };
    
    const trainingTypeDistribution: Record<TrainingType, number> = {
      recovery: 0,
      endurance: 0,
      tempo: 0,
      threshold: 0,
      interval: 0,
      mixed: 0,
      unknown: 0,
    };
    
    let totalEfficiency = 0;
    let activitiesWithHR = 0;
    
    activities.forEach(activity => {
      const analysis = this.analyzeActivity(activity);
      
      // Accumuler le temps par zone
      Object.keys(totalTimeByZone).forEach(key => {
        totalTimeByZone[key as keyof ZoneDistribution] += 
          analysis.distribution[key as keyof ZoneDistribution];
      });
      
      // Compter les types d'entraînement
      trainingTypeDistribution[analysis.trainingType]++;
      
      // Accumuler l'efficacité
      if (analysis.trainingType !== 'unknown') {
        totalEfficiency += analysis.efficiency;
        activitiesWithHR++;
      }
    });
    
    // Calculer les pourcentages moyens
    const averagePercentages = calculateZonePercentages(totalTimeByZone);
    
    // Calculer l'efficacité moyenne
    const averageEfficiency = activitiesWithHR > 0 
      ? totalEfficiency / activitiesWithHR 
      : 0;
    
    return {
      totalTimeByZone,
      averagePercentages,
      trainingTypeDistribution,
      averageEfficiency,
    };
  }
  
  /**
   * Obtient des recommandations d'entraînement basées sur l'historique
   */
  static getTrainingRecommendations(activities: Activity[]): string[] {
    const stats = this.getZoneStatistics(activities);
    const recommendations: string[] = [];
    
    const { averagePercentages } = stats;
    
    // Analyse de la répartition globale
    if (averagePercentages.zone2 < 50) {
      recommendations.push('💡 Augmentez votre volume en Zone 2 (endurance de base)');
    }
    
    if (averagePercentages.zone5 > 15) {
      recommendations.push('⚠️ Trop de temps en Zone 5 - Risque de surentraînement');
      recommendations.push('💡 Privilégiez les zones 2-3 pour 70-80% de votre entraînement');
    }
    
    if (averagePercentages.zone1 > 40) {
      recommendations.push('💡 Vos séances sont très douces - Ajoutez des séances plus intenses');
    }
    
    // Analyse des types d'entraînement
    const totalActivities = Object.values(stats.trainingTypeDistribution).reduce((a, b) => a + b, 0);
    
    if (totalActivities > 0) {
      const endurancePercent = (stats.trainingTypeDistribution.endurance / totalActivities) * 100;
      const intervalPercent = (stats.trainingTypeDistribution.interval / totalActivities) * 100;
      
      if (endurancePercent < 60) {
        recommendations.push('💡 Augmentez la proportion de séances d\'endurance (60-70% du total)');
      }
      
      if (intervalPercent > 20) {
        recommendations.push('⚠️ Trop de séances intenses - Risque de fatigue');
      }
      
      if (intervalPercent === 0 && totalActivities > 5) {
        recommendations.push('💡 Ajoutez 1-2 séances d\'intervalles par semaine pour progresser');
      }
    }
    
    // Recommandations basées sur l'efficacité
    if (stats.averageEfficiency < 60) {
      recommendations.push('💡 Travaillez la régularité de vos allures dans chaque zone');
    }
    
    return recommendations;
  }
  
  /**
   * Réinitialise les paramètres aux valeurs par défaut
   */
  static resetToDefaults(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Made with Bob