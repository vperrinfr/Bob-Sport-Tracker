import { useState, useEffect } from 'react';
import type { CommentaryResult, StreamingState } from '../../types/commentary';

/**
 * Composant pour afficher un commentaire généré avec animation
 * Supporte le streaming et les animations de texte
 */

interface CommentaryDisplayProps {
  /** Commentaire à afficher */
  commentary: CommentaryResult | null;
  /** État du streaming */
  streamingState?: StreamingState;
  /** Afficher les métadonnées (temps de génération, modèle) */
  showMetadata?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Callback quand l'utilisateur clique sur régénérer */
  onRegenerate?: () => void;
  /** Callback quand l'utilisateur clique sur copier */
  onCopy?: () => void;
  /** Afficher les boutons d'action */
  showActions?: boolean;
}

export function CommentaryDisplay({
  commentary,
  streamingState,
  showMetadata = false,
  className = '',
  onRegenerate,
  onCopy,
  showActions = true,
}: CommentaryDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gérer l'animation du texte en streaming
  useEffect(() => {
    if (streamingState?.isGenerating && streamingState.text) {
      setDisplayedText(streamingState.text);
      setIsAnimating(true);
    } else if (commentary && !streamingState?.isGenerating) {
      setDisplayedText(commentary.text);
      setIsAnimating(false);
    }
  }, [commentary, streamingState]);

  // Gérer la copie dans le presse-papiers
  const handleCopy = async () => {
    if (!displayedText) return;

    try {
      await navigator.clipboard.writeText(displayedText);
      setCopied(true);
      if (onCopy) onCopy();
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Formater le temps de génération
  const formatGenerationTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!commentary && !streamingState?.text) {
    return null;
  }

  return (
    <div className={`commentary-display ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Commentaire du Coach
          </h3>
          {isAnimating && (
            <span className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
              <span className="animate-pulse">●</span>
              Génération en cours...
            </span>
          )}
        </div>

        {showActions && !isAnimating && (
          <div className="flex items-center gap-2">
            {/* Bouton Copier */}
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Copier le commentaire"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Bouton Régénérer */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Régénérer le commentaire"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu du commentaire */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-100 dark:border-gray-700">
        <p className={`text-gray-800 dark:text-gray-200 leading-relaxed text-lg ${isAnimating ? 'animate-pulse' : ''}`}>
          {displayedText}
        </p>

        {/* Barre de progression pour le streaming */}
        {isAnimating && streamingState && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${streamingState.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Métadonnées */}
      {showMetadata && commentary && !isAnimating && (
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Généré en {formatGenerationTime(commentary.generationTime)}
          </span>
          
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            {commentary.model}
          </span>

          {commentary.tokensGenerated && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {commentary.tokensGenerated} tokens
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour afficher un état de chargement
 */
export function CommentaryLoadingState() {
  return (
    <div className="commentary-display">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Commentaire du Coach
        </h3>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-100 dark:border-gray-700">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher une erreur
 */
interface CommentaryErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function CommentaryErrorState({ error, onRetry }: CommentaryErrorStateProps) {
  return (
    <div className="commentary-display">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚠️</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Erreur de génération
        </h3>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-200 mb-4">
          {error}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Composant pour afficher un état vide (pas encore généré)
 */
interface CommentaryEmptyStateProps {
  onGenerate?: () => void;
}

export function CommentaryEmptyState({ onGenerate }: CommentaryEmptyStateProps) {
  return (
    <div className="commentary-display">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Commentaire du Coach
        </h3>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aucun commentaire généré pour cette activité
        </p>

        {onGenerate && (
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Générer un commentaire
          </button>
        )}
      </div>
    </div>
  );
}

// Made with ❤️ by Bob

// Made with Bob
