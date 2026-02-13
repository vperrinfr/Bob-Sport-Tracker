// Types pour la génération de commentaires avec Ollama et IBM Granite

/**
 * Style de commentaire disponible
 */
export const CommentaryStyle = {
  ENTHUSIASTIC: 'enthusiastic',  // Style enthousiaste et motivant (coach sportif)
  TECHNICAL: 'technical',        // Style technique et analytique
  NARRATIVE: 'narrative',        // Style narratif et descriptif
} as const;

export type CommentaryStyle = typeof CommentaryStyle[keyof typeof CommentaryStyle];

/**
 * Configuration du service Ollama
 */
export interface OllamaConfig {
  /** URL de l'instance Ollama (par défaut: http://localhost:11434) */
  baseUrl: string;
  /** Nom du modèle à utiliser (par défaut: granite3.1-dense:2b) */
  model: string;
  /** Timeout en millisecondes pour les requêtes (par défaut: 30000) */
  timeout: number;
  /** Activer le streaming des réponses (par défaut: true) */
  streaming: boolean;
}

/**
 * Options de génération pour le modèle
 */
export interface GenerationOptions {
  /** Température (0.0 = déterministe, 1.0 = créatif) */
  temperature: number;
  /** Top-p sampling (diversité du vocabulaire) */
  top_p: number;
  /** Top-k sampling (limitation des choix de mots) */
  top_k: number;
  /** Pénalité de répétition */
  repeat_penalty: number;
  /** Nombre maximum de tokens à générer */
  num_predict: number;
  /** Taille du contexte */
  num_ctx: number;
}

/**
 * Paramètres de génération de commentaire
 */
export interface CommentaryGenerationParams {
  /** Style de commentaire souhaité */
  style: CommentaryStyle;
  /** Longueur du commentaire (short, medium, long) */
  length: 'short' | 'medium' | 'long';
  /** Inclure des émojis dans le commentaire */
  includeEmojis: boolean;
  /** Langue du commentaire (par défaut: 'fr') */
  language: string;
}

/**
 * Résultat de génération de commentaire
 */
export interface CommentaryResult {
  /** Texte du commentaire généré */
  text: string;
  /** Style utilisé */
  style: CommentaryStyle;
  /** Timestamp de génération */
  generatedAt: Date;
  /** Durée de génération en millisecondes */
  generationTime: number;
  /** Modèle utilisé */
  model: string;
  /** Nombre de tokens générés */
  tokensGenerated?: number;
}

/**
 * État de génération en streaming
 */
export interface StreamingState {
  /** Texte accumulé jusqu'à présent */
  text: string;
  /** Génération en cours */
  isGenerating: boolean;
  /** Progression (0-100) */
  progress: number;
  /** Erreur éventuelle */
  error?: string;
}

/**
 * Moment clé détecté dans une activité
 */
export interface KeyMoment {
  /** Type de moment clé */
  type: 'start' | 'best_pace' | 'heart_rate_peak' | 'elevation_gain' | 'finish' | 'milestone';
  /** Timestamp du moment (en secondes depuis le début) */
  timestamp: number;
  /** Description du moment */
  description: string;
  /** Valeur associée (vitesse, FC, altitude, etc.) */
  value?: number;
  /** Unité de la valeur */
  unit?: string;
  /** Importance du moment (1-5) */
  importance: number;
}

/**
 * Données formatées pour la génération de commentaire
 */
export interface FormattedActivityData {
  /** Type de sport */
  sport: string;
  /** Distance totale (en km) */
  distance: number;
  /** Durée totale (formatée) */
  duration: string;
  /** Allure moyenne (min/km) */
  averagePace?: string;
  /** Vitesse moyenne (km/h) */
  averageSpeed: number;
  /** Vitesse maximale (km/h) */
  maxSpeed: number;
  /** Fréquence cardiaque moyenne */
  averageHeartRate?: number;
  /** Fréquence cardiaque maximale */
  maxHeartRate?: number;
  /** Dénivelé positif (m) */
  elevationGain?: number;
  /** Dénivelé négatif (m) */
  elevationLoss?: number;
  /** Calories brûlées */
  calories?: number;
  /** Moments clés de l'activité */
  keyMoments: KeyMoment[];
  /** Conditions météo (si disponibles) */
  weather?: {
    temperature?: number;
    conditions?: string;
  };
}

/**
 * Configuration du commentaire en temps réel
 */
export interface LiveCommentaryConfig {
  /** Activer le commentaire en temps réel */
  enabled: boolean;
  /** Vitesse de lecture (0.5x, 1x, 2x, 4x) */
  playbackSpeed: number;
  /** Intervalle entre les commentaires (en secondes) */
  commentaryInterval: number;
  /** Commenter uniquement les moments clés */
  keyMomentsOnly: boolean;
}

/**
 * État du commentaire en temps réel
 */
export interface LiveCommentaryState {
  /** Commentaire en cours d'exécution */
  isPlaying: boolean;
  /** Position actuelle (en secondes) */
  currentPosition: number;
  /** Dernier commentaire généré */
  lastCommentary?: string;
  /** Prochain moment clé à commenter */
  nextKeyMoment?: KeyMoment;
}

/**
 * Statistiques de génération
 */
export interface GenerationStats {
  /** Nombre total de commentaires générés */
  totalGenerated: number;
  /** Temps moyen de génération (ms) */
  averageGenerationTime: number;
  /** Nombre d'erreurs */
  errorCount: number;
  /** Dernier succès */
  lastSuccess?: Date;
  /** Dernière erreur */
  lastError?: Date;
}

/**
 * État de connexion Ollama
 */
export interface OllamaConnectionState {
  /** Ollama est connecté */
  isConnected: boolean;
  /** Modèle est disponible */
  modelAvailable: boolean;
  /** Version d'Ollama */
  version?: string;
  /** Liste des modèles disponibles */
  availableModels: string[];
  /** Dernier test de connexion */
  lastChecked?: Date;
  /** Message d'erreur si non connecté */
  error?: string;
}

/**
 * Cache de commentaires
 */
export interface CommentaryCache {
  /** ID de l'activité */
  activityId: string;
  /** Commentaire en cache */
  commentary: CommentaryResult;
  /** Date de mise en cache */
  cachedAt: Date;
  /** Paramètres utilisés pour la génération */
  params: CommentaryGenerationParams;
}

/**
 * Événement de streaming
 */
export interface StreamEvent {
  /** Type d'événement */
  type: 'start' | 'chunk' | 'complete' | 'error';
  /** Données de l'événement */
  data?: string;
  /** Erreur éventuelle */
  error?: string;
  /** Métadonnées */
  metadata?: {
    tokensGenerated?: number;
    model?: string;
  };
}

/**
 * Prompt système pour différents styles
 */
export interface SystemPrompt {
  /** Style associé */
  style: CommentaryStyle;
  /** Texte du prompt système */
  text: string;
  /** Instructions spécifiques */
  instructions: string[];
  /** Exemples de sortie */
  examples?: string[];
}

/**
 * Configuration des préférences utilisateur
 */
export interface UserPreferences {
  /** Style de commentaire préféré */
  preferredStyle: CommentaryStyle;
  /** Génération automatique activée */
  autoGenerate: boolean;
  /** Streaming activé */
  streamingEnabled: boolean;
  /** Inclure des émojis */
  includeEmojis: boolean;
  /** Longueur préférée */
  preferredLength: 'short' | 'medium' | 'long';
  /** Langue */
  language: string;
}

/**
 * Erreur Ollama personnalisée
 */
export class OllamaError extends Error {
  code: 'CONNECTION_FAILED' | 'MODEL_NOT_FOUND' | 'GENERATION_FAILED' | 'TIMEOUT' | 'INVALID_RESPONSE';
  details?: unknown;

  constructor(
    message: string,
    code: 'CONNECTION_FAILED' | 'MODEL_NOT_FOUND' | 'GENERATION_FAILED' | 'TIMEOUT' | 'INVALID_RESPONSE',
    details?: unknown
  ) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Réponse de l'API Ollama
 */
export interface OllamaResponse {
  /** Modèle utilisé */
  model: string;
  /** Timestamp de création */
  created_at: string;
  /** Réponse générée */
  response: string;
  /** Génération terminée */
  done: boolean;
  /** Contexte (pour conversations) */
  context?: number[];
  /** Durée totale (ns) */
  total_duration?: number;
  /** Durée de chargement (ns) */
  load_duration?: number;
  /** Nombre de tokens dans le prompt */
  prompt_eval_count?: number;
  /** Durée d'évaluation du prompt (ns) */
  prompt_eval_duration?: number;
  /** Nombre de tokens générés */
  eval_count?: number;
  /** Durée de génération (ns) */
  eval_duration?: number;
}

/**
 * Réponse streaming de l'API Ollama
 */
export interface OllamaStreamResponse extends OllamaResponse {
  /** Chunk de réponse */
  response: string;
  /** Génération terminée */
  done: boolean;
}

// Made with ❤️ by Bob

// Made with Bob
