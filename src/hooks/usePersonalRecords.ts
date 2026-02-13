// Hook pour les records personnels

import { useState, useEffect, useCallback } from 'react';
import type { 
  PersonalRecord, 
  RecordsByCategory, 
  RecordStatistics 
} from '../types/records';
import { PersonalRecordsService } from '../services/personalRecordsService';
import type { Activity } from '../types/activity';

export function usePersonalRecords() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allRecords = await PersonalRecordsService.getAllRecords();
      setRecords(allRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const detectRecords = useCallback(async (activity: Activity) => {
    try {
      const newRecords = await PersonalRecordsService.detectAndSaveRecords(activity);
      if (newRecords.length > 0) {
        await loadRecords();
      }
      return newRecords;
    } catch (err) {
      console.error('Erreur lors de la détection des records:', err);
      return [];
    }
  }, [loadRecords]);

  const markAsSeen = useCallback(async (recordIds: string[]) => {
    try {
      await PersonalRecordsService.markRecordsAsSeen(recordIds);
      await loadRecords();
    } catch (err) {
      console.error('Erreur lors de la mise à jour des records:', err);
    }
  }, [loadRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await PersonalRecordsService.deleteRecord(id);
      await loadRecords();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, [loadRecords]);

  return {
    records,
    loading,
    error,
    reload: loadRecords,
    detectRecords,
    markAsSeen,
    deleteRecord,
  };
}

export function useNewRecords() {
  const [newRecords, setNewRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNewRecords = useCallback(async () => {
    try {
      setLoading(true);
      const records = await PersonalRecordsService.getNewRecords();
      setNewRecords(records);
    } catch (err) {
      console.error('Erreur lors du chargement des nouveaux records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewRecords();
  }, [loadNewRecords]);

  return { newRecords, loading, reload: loadNewRecords };
}

export function useRecordsByCategory() {
  const [recordsByCategory, setRecordsByCategory] = useState<RecordsByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecordsByCategory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const grouped = await PersonalRecordsService.getRecordsGroupedByCategory();
      setRecordsByCategory(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecordsByCategory();
  }, [loadRecordsByCategory]);

  return { recordsByCategory, loading, error, reload: loadRecordsByCategory };
}

export function useRecordStatistics() {
  const [statistics, setStatistics] = useState<RecordStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await PersonalRecordsService.getRecordStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  return { statistics, loading, error, reload: loadStatistics };
}

export function useActivityRecordComparison(activity: Activity | null) {
  const [comparison, setComparison] = useState<Awaited<ReturnType<typeof PersonalRecordsService.compareActivityToRecords>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activity) {
      setComparison(null);
      return;
    }

    const loadComparison = async () => {
      try {
        setLoading(true);
        const result = await PersonalRecordsService.compareActivityToRecords(activity);
        setComparison(result);
      } catch (err) {
        console.error('Erreur lors de la comparaison:', err);
        setComparison(null);
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [activity]);

  return { comparison, loading };
}

// Made with Bob