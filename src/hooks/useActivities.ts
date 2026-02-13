import { useState, useEffect, useCallback } from 'react';
import { ActivityService } from '../services/database';
import type { Activity, ActivityFilter } from '../types/activity';

export function useActivities(filters?: ActivityFilter) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result: Activity[];
      if (filters) {
        result = await ActivityService.filterActivities(filters);
      } else {
        result = await ActivityService.getAllActivities();
      }
      
      setActivities(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const deleteActivity = useCallback(async (id: string) => {
    try {
      await ActivityService.deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, []);

  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    try {
      await ActivityService.updateActivity(id, updates);
      setActivities(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updates } : a))
      );
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  }, []);

  return {
    activities,
    loading,
    error,
    reload: loadActivities,
    deleteActivity,
    updateActivity,
  };
}

export function useActivity(id: string) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await ActivityService.getActivityById(id);
        setActivity(result || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'activité');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id]);

  return { activity, loading, error };
}

// Made with Bob