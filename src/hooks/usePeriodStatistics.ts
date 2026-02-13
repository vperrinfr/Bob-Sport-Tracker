// Hook pour les statistiques par période

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActivities } from './useActivities';
import type { PeriodType, PeriodStatistics, ComparisonData, EvolutionMetric } from '../types/statistics';
import {
  calculatePeriodStats,
  comparePeriods,
  getEvolutionData,
  getActivityHeatmap,
} from '../services/periodStatistics';

export function usePeriodStatistics(period: PeriodType = 'week', date: Date = new Date()) {
  const { activities, loading: activitiesLoading } = useActivities();
  const [statistics, setStatistics] = useState<PeriodStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activitiesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const stats = calculatePeriodStats(activities, period, date);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des statistiques');
    } finally {
      setLoading(false);
    }
  }, [activities, period, date, activitiesLoading]);

  return { statistics, loading, error };
}

export function usePeriodComparison(period: PeriodType = 'week', date: Date = new Date()) {
  const { activities, loading: activitiesLoading } = useActivities();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activitiesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const comp = comparePeriods(activities, period, date);
      setComparison(comp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  }, [activities, period, date, activitiesLoading]);

  return { comparison, loading, error };
}

export function useEvolutionData(
  metric: 'distance' | 'time' | 'speed' | 'heartRate' | 'activities',
  period: PeriodType = 'week',
  numberOfPeriods: number = 12
) {
  const { activities, loading: activitiesLoading } = useActivities();
  const [evolution, setEvolution] = useState<EvolutionMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activitiesLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const evo = getEvolutionData(activities, metric, period, numberOfPeriods);
      setEvolution(evo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul de l\'évolution');
    } finally {
      setLoading(false);
    }
  }, [activities, metric, period, numberOfPeriods, activitiesLoading]);

  return { evolution, loading, error };
}

export function useActivityHeatmap(startDate: Date, endDate: Date) {
  const { activities, loading: activitiesLoading } = useActivities();
  
  const heatmap = useMemo(() => {
    if (activitiesLoading || activities.length === 0) return [];
    
    try {
      return getActivityHeatmap(activities, { start: startDate, end: endDate });
    } catch (err) {
      console.error('Erreur lors du calcul de la heatmap:', err);
      return [];
    }
  }, [activities, startDate, endDate, activitiesLoading]);

  return { heatmap, loading: activitiesLoading };
}

// Made with Bob