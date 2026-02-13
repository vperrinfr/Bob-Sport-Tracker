// Hook pour les zones d'entraînement

import { useState, useEffect, useCallback } from 'react';
import { useActivities } from './useActivities';
import type { 
  ZoneSettings, 
  ZoneAnalysis, 
  HeartRateZone,
  ZoneCalculationMethod 
} from '../types/trainingZones';
import { TrainingZonesService } from '../services/trainingZonesService';
import type { Activity } from '../types/activity';

export function useTrainingZones() {
  const [settings, setSettings] = useState<ZoneSettings | null>(null);
  const [zones, setZones] = useState<HeartRateZone[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      setLoading(true);
      const savedSettings = TrainingZonesService.getSettings();
      const currentZones = TrainingZonesService.getZones();
      
      setSettings(savedSettings);
      setZones(currentZones);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const configureByAge = useCallback((age: number) => {
    const newSettings = TrainingZonesService.configureByAge(age);
    setSettings(newSettings);
    setZones(TrainingZonesService.getZones());
  }, []);

  const configureByKarvonen = useCallback((age: number, restingHR: number) => {
    const newSettings = TrainingZonesService.configureByKarvonen(age, restingHR);
    setSettings(newSettings);
    setZones(TrainingZonesService.getZones());
  }, []);

  const configureManually = useCallback((maxHR: number, customZones?: HeartRateZone[]) => {
    const newSettings = TrainingZonesService.configureManually(maxHR, customZones);
    setSettings(newSettings);
    setZones(TrainingZonesService.getZones());
  }, []);

  const resetToDefaults = useCallback(() => {
    TrainingZonesService.resetToDefaults();
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    zones,
    loading,
    configureByAge,
    configureByKarvonen,
    configureManually,
    resetToDefaults,
    reload: loadSettings,
  };
}

export function useActivityZoneAnalysis(activity: Activity | null) {
  const [analysis, setAnalysis] = useState<ZoneAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activity) {
      setAnalysis(null);
      return;
    }

    try {
      setLoading(true);
      const result = TrainingZonesService.analyzeActivity(activity);
      setAnalysis(result);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des zones:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [activity]);

  return { analysis, loading };
}

export function useZoneStatistics() {
  const { activities, loading: activitiesLoading } = useActivities();
  const [statistics, setStatistics] = useState<ReturnType<typeof TrainingZonesService.getZoneStatistics> | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activitiesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      const stats = TrainingZonesService.getZoneStatistics(activities);
      const recs = TrainingZonesService.getTrainingRecommendations(activities);
      
      setStatistics(stats);
      setRecommendations(recs);
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques de zones:', error);
    } finally {
      setLoading(false);
    }
  }, [activities, activitiesLoading]);

  return { statistics, recommendations, loading };
}

// Made with Bob