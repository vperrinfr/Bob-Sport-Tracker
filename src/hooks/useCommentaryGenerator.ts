import { useState, useCallback, useEffect, useRef } from 'react';
import type { Activity } from '../types/activity';
import type {
  CommentaryResult,
  CommentaryGenerationParams,
  StreamingState,
  CommentaryCache,
} from '../types/commentary';
import {
  generateCommentary,
  generateCommentaryWithStreaming,
  validateAndCleanCommentary,
} from '../services/commentaryGenerator';
import { ollamaService } from '../services/ollamaService';

/**
 * Hook React pour la génération de commentaires avec Ollama
 * Gère l'état, le cache, et le streaming
 */

interface UseCommentaryGeneratorOptions {
  /** Activer le cache des commentaires */
  enableCache?: boolean;
  /** Activer le streaming par défaut */
  enableStreaming?: boolean;
  /** Paramètres de génération par défaut */
  defaultParams?: Partial<CommentaryGenerationParams>;
}

interface UseCommentaryGeneratorReturn {
  /** Commentaire généré */
  commentary: CommentaryResult | null;
  /** État de génération en cours */
  isGenerating: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** État du streaming */
  streamingState: StreamingState;
  /** Fonction pour générer un commentaire */
  generate: (activity: Activity, params?: Partial<CommentaryGenerationParams>) => Promise<void>;
  /** Fonction pour régénérer un commentaire */
  regenerate: () => Promise<void>;
  /** Fonction pour annuler la génération en cours */
  cancel: () => void;
  /** Fonction pour nettoyer l'état */
  reset: () => void;
  /** Vérifier si Ollama est connecté */
  checkConnection: () => Promise<boolean>;
}

export function useCommentaryGenerator(
  options: UseCommentaryGeneratorOptions = {}
): UseCommentaryGeneratorReturn {
  const {
    enableCache = true,
    enableStreaming = true,
    defaultParams = {},
  } = options;

  // État
  const [commentary, setCommentary] = useState<CommentaryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    text: '',
    isGenerating: false,
    progress: 0,
  });

  // Références
  const currentActivityRef = useRef<Activity | null>(null);
  const currentParamsRef = useRef<CommentaryGenerationParams | null>(null);
  const cacheRef = useRef<Map<string, CommentaryCache>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Vérifie la connexion à Ollama
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await ollamaService.testConnection();
      return state.isConnected && state.modelAvailable;
    } catch {
      return false;
    }
  }, []);

  /**
   * Récupère un commentaire du cache
   */
  const getFromCache = useCallback(
    (activityId: string, params: CommentaryGenerationParams): CommentaryResult | null => {
      if (!enableCache) return null;

      const cached = cacheRef.current.get(activityId);
      if (!cached) return null;

      // Vérifier si les paramètres correspondent
      const paramsMatch =
        cached.params.style === params.style &&
        cached.params.length === params.length &&
        cached.params.includeEmojis === params.includeEmojis &&
        cached.params.language === params.language;

      if (!paramsMatch) return null;

      // Vérifier si le cache n'est pas trop ancien (1 heure)
      const cacheAge = Date.now() - cached.cachedAt.getTime();
      if (cacheAge > 3600000) {
        cacheRef.current.delete(activityId);
        return null;
      }

      return cached.commentary;
    },
    [enableCache]
  );

  /**
   * Sauvegarde un commentaire dans le cache
   */
  const saveToCache = useCallback(
    (activityId: string, commentary: CommentaryResult, params: CommentaryGenerationParams) => {
      if (!enableCache) return;

      cacheRef.current.set(activityId, {
        activityId,
        commentary,
        cachedAt: new Date(),
        params,
      });
    },
    [enableCache]
  );

  /**
   * Génère un commentaire
   */
  const generate = useCallback(
    async (activity: Activity, params?: Partial<CommentaryGenerationParams>) => {
      // Annuler toute génération en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Créer un nouveau AbortController
      abortControllerRef.current = new AbortController();

      // Réinitialiser l'état
      setError(null);
      setIsGenerating(true);
      setStreamingState({
        text: '',
        isGenerating: true,
        progress: 0,
      });

      // Sauvegarder l'activité et les paramètres
      currentActivityRef.current = activity;
      const fullParams: CommentaryGenerationParams = {
        style: params?.style || defaultParams.style || 'enthusiastic',
        length: params?.length || defaultParams.length || 'medium',
        includeEmojis: params?.includeEmojis ?? defaultParams.includeEmojis ?? true,
        language: params?.language || defaultParams.language || 'fr',
      };
      currentParamsRef.current = fullParams;

      try {
        // Vérifier le cache
        const cached = getFromCache(activity.id, fullParams);
        if (cached) {
          setCommentary(cached);
          setIsGenerating(false);
          setStreamingState({
            text: cached.text,
            isGenerating: false,
            progress: 100,
          });
          return;
        }

        // Vérifier la connexion
        const isConnected = await checkConnection();
        if (!isConnected) {
          throw new Error(
            'Ollama n\'est pas connecté. Vérifiez que le service est démarré et que le modèle est installé.'
          );
        }

        let result: CommentaryResult;

        if (enableStreaming) {
          // Génération avec streaming
          result = await generateCommentaryWithStreaming(
            activity,
            fullParams,
            (chunk: string) => {
              setStreamingState(prev => ({
                text: prev.text + chunk,
                isGenerating: true,
                progress: Math.min(prev.progress + 2, 95),
              }));
            }
          );
        } else {
          // Génération sans streaming
          result = await generateCommentary(activity, fullParams);
        }

        // Nettoyer et valider le commentaire
        result.text = validateAndCleanCommentary(result.text);

        // Sauvegarder dans le cache
        saveToCache(activity.id, result, fullParams);

        // Mettre à jour l'état
        setCommentary(result);
        setStreamingState({
          text: result.text,
          isGenerating: false,
          progress: 100,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        setStreamingState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [enableStreaming, defaultParams, getFromCache, saveToCache, checkConnection]
  );

  /**
   * Régénère le dernier commentaire
   */
  const regenerate = useCallback(async () => {
    if (!currentActivityRef.current || !currentParamsRef.current) {
      setError('Aucune activité à régénérer');
      return;
    }

    // Supprimer du cache pour forcer la régénération
    if (enableCache) {
      cacheRef.current.delete(currentActivityRef.current.id);
    }

    await generate(currentActivityRef.current, currentParamsRef.current);
  }, [generate, enableCache]);

  /**
   * Annule la génération en cours
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsGenerating(false);
    setStreamingState(prev => ({
      ...prev,
      isGenerating: false,
    }));
  }, []);

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    cancel();
    setCommentary(null);
    setError(null);
    setStreamingState({
      text: '',
      isGenerating: false,
      progress: 0,
    });
    currentActivityRef.current = null;
    currentParamsRef.current = null;
  }, [cancel]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    commentary,
    isGenerating,
    error,
    streamingState,
    generate,
    regenerate,
    cancel,
    reset,
    checkConnection,
  };
}

/**
 * Hook simplifié pour générer un commentaire automatiquement au montage
 */
export function useAutoCommentary(
  activity: Activity | null,
  params?: Partial<CommentaryGenerationParams>
): UseCommentaryGeneratorReturn {
  const generator = useCommentaryGenerator({ enableCache: true, enableStreaming: true });

  useEffect(() => {
    if (activity && !generator.commentary && !generator.isGenerating) {
      generator.generate(activity, params);
    }
  }, [activity?.id]); // Seulement quand l'ID de l'activité change

  return generator;
}

// Made with ❤️ by Bob

// Made with Bob
