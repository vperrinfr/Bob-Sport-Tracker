import { useState, useEffect, useCallback } from 'react';
import { StravaAuthService } from '../services/stravaAuth';
import { StravaSyncService } from '../services/stravaSync';
import type { StravaAuthState, StravaSyncResult } from '../types/strava';

export function useStravaAuth() {
  const [authState, setAuthState] = useState<StravaAuthState>({
    isAuthenticated: false,
    athlete: null,
    tokens: null,
    lastSync: null,
  });
  const [loading, setLoading] = useState(true);

  const loadAuthState = useCallback(async () => {
    try {
      setLoading(true);
      const state = await StravaAuthService.getAuthState();
      setAuthState(state);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état d\'authentification:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  const login = useCallback(() => {
    StravaAuthService.authorize();
  }, []);

  const logout = useCallback(async () => {
    try {
      await StravaAuthService.logout();
      setAuthState({
        isAuthenticated: false,
        athlete: null,
        tokens: null,
        lastSync: null,
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }, []);

  const handleCallback = useCallback(async (code: string) => {
    try {
      await StravaAuthService.exchangeToken(code);
      await loadAuthState();
    } catch (error) {
      console.error('Erreur lors de l\'échange du token:', error);
      throw error;
    }
  }, [loadAuthState]);

  return {
    authState,
    loading,
    login,
    logout,
    handleCallback,
    reload: loadAuthState,
  };
}

export function useStravaSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<StravaSyncResult | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [newActivitiesCount, setNewActivitiesCount] = useState<number>(0);

  const syncRecentActivities = useCallback(async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await StravaSyncService.syncRecentActivities();
      setSyncResult(result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      const errorResult: StravaSyncResult = {
        success: false,
        activitiesImported: 0,
        activitiesSkipped: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      };
      setSyncResult(errorResult);
      return errorResult;
    } finally {
      setSyncing(false);
    }
  }, []);

  const syncAllActivities = useCallback(async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setProgress({ current: 0, total: 0 });

      const result = await StravaSyncService.syncAllActivities((current, total) => {
        setProgress({ current, total });
      });

      setSyncResult(result);
      setProgress(null);
      return result;
    } catch (error) {
      console.error('Erreur lors de la synchronisation complète:', error);
      const errorResult: StravaSyncResult = {
        success: false,
        activitiesImported: 0,
        activitiesSkipped: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      };
      setSyncResult(errorResult);
      setProgress(null);
      return errorResult;
    } finally {
      setSyncing(false);
    }
  }, []);

  const syncSince = useCallback(async (date: Date) => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await StravaSyncService.syncActivitiesSince(date);
      setSyncResult(result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      const errorResult: StravaSyncResult = {
        success: false,
        activitiesImported: 0,
        activitiesSkipped: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      };
      setSyncResult(errorResult);
      return errorResult;
    } finally {
      setSyncing(false);
    }
  }, []);

  const checkForNewActivities = useCallback(async () => {
    try {
      const count = await StravaSyncService.checkForNewActivities();
      setNewActivitiesCount(count);
      return count;
    } catch (error) {
      console.error('Erreur lors de la vérification des nouvelles activités:', error);
      return 0;
    }
  }, []);

  const deleteAllStravaActivities = useCallback(async () => {
    try {
      const count = await StravaSyncService.deleteAllStravaActivities();
      return count;
    } catch (error) {
      console.error('Erreur lors de la suppression des activités Strava:', error);
      throw error;
    }
  }, []);

  return {
    syncing,
    syncResult,
    progress,
    newActivitiesCount,
    syncRecentActivities,
    syncAllActivities,
    syncSince,
    checkForNewActivities,
    deleteAllStravaActivities,
  };
}

// Made with Bob