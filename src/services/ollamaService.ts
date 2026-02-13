import { Ollama } from 'ollama/browser';
import type {
  OllamaConfig,
  GenerationOptions,
  OllamaConnectionState,
  OllamaResponse,
} from '../types/commentary';
import { OllamaError } from '../types/commentary';

/**
 * Service de communication avec Ollama
 * Gère la connexion, les requêtes, et le streaming avec le modèle IBM Granite 3.3:2b
 */
export class OllamaService {
  private client: Ollama;
  private config: OllamaConfig;
  private connectionState: OllamaConnectionState;

  /**
   * Configuration par défaut pour Ollama
   */
  private static readonly DEFAULT_CONFIG: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    model: 'granite3.3:2b',
    timeout: 30000,
    streaming: true,
  };

  /**
   * Options de génération par défaut optimisées pour Granite 3.3:2b
   */
  private static readonly DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
    temperature: 0.7,      // Créativité modérée
    top_p: 0.9,           // Diversité du vocabulaire
    top_k: 40,            // Limitation des choix de mots
    repeat_penalty: 1.1,  // Éviter les répétitions
    num_predict: 200,     // Longueur maximale du commentaire
    num_ctx: 2048,        // Taille du contexte (adapté au modèle 2B)
  };

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...OllamaService.DEFAULT_CONFIG, ...config };
    this.client = new Ollama({ host: this.config.baseUrl });
    this.connectionState = {
      isConnected: false,
      modelAvailable: false,
      availableModels: [],
    };
  }

  /**
   * Teste la connexion à Ollama et vérifie la disponibilité du modèle
   */
  async testConnection(): Promise<OllamaConnectionState> {
    try {
      // Vérifier que le serveur Ollama répond
      const response = await this.withTimeout(
        fetch(`${this.config.baseUrl}/api/tags`),
        5000,
        'Timeout lors de la connexion à Ollama'
      );

      if (!response.ok) {
        throw new OllamaError(
          'Ollama ne répond pas correctement',
          'CONNECTION_FAILED',
          { status: response.status }
        );
      }

      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];

      // Vérifier si le modèle configuré est disponible
      const modelAvailable = models.includes(this.config.model);

      this.connectionState = {
        isConnected: true,
        modelAvailable,
        availableModels: models,
        lastChecked: new Date(),
        version: data.version,
      };

      if (!modelAvailable) {
        this.connectionState.error = `Le modèle "${this.config.model}" n'est pas installé. Modèles disponibles: ${models.join(', ')}`;
      }

      return this.connectionState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.connectionState = {
        isConnected: false,
        modelAvailable: false,
        availableModels: [],
        lastChecked: new Date(),
        error: `Impossible de se connecter à Ollama: ${errorMessage}`,
      };

      return this.connectionState;
    }
  }

  /**
   * Génère un commentaire avec streaming
   * @param prompt Le prompt à envoyer au modèle
   * @param options Options de génération personnalisées
   * @param onChunk Callback appelé pour chaque chunk reçu
   */
  async generateWithStreaming(
    prompt: string,
    options?: Partial<GenerationOptions>,
    onChunk?: (chunk: string) => void
  ): Promise<OllamaResponse> {
    // Vérifier la connexion avant de générer
    if (!this.connectionState.isConnected || !this.connectionState.modelAvailable) {
      await this.testConnection();
      
      if (!this.connectionState.isConnected) {
        throw new OllamaError(
          'Ollama n\'est pas connecté. Vérifiez que le service est démarré.',
          'CONNECTION_FAILED'
        );
      }

      if (!this.connectionState.modelAvailable) {
        throw new OllamaError(
          `Le modèle "${this.config.model}" n'est pas disponible. Installez-le avec: ollama pull ${this.config.model}`,
          'MODEL_NOT_FOUND'
        );
      }
    }

    const generationOptions = {
      ...OllamaService.DEFAULT_GENERATION_OPTIONS,
      ...options,
    };

    try {
      const startTime = Date.now();
      let fullResponse = '';
      let tokenCount = 0;

      const stream = await this.client.generate({
        model: this.config.model,
        prompt,
        stream: true,
        options: {
          temperature: generationOptions.temperature,
          top_p: generationOptions.top_p,
          top_k: generationOptions.top_k,
          repeat_penalty: generationOptions.repeat_penalty,
          num_predict: generationOptions.num_predict,
          num_ctx: generationOptions.num_ctx,
        },
      });

      for await (const chunk of stream) {
        if (chunk.response) {
          fullResponse += chunk.response;
          tokenCount++;
          
          // Appeler le callback pour chaque chunk
          if (onChunk) {
            onChunk(chunk.response);
          }
        }

        // Si la génération est terminée
        if (chunk.done) {
          const endTime = Date.now();
          
          return {
            model: this.config.model,
            created_at: new Date().toISOString(),
            response: fullResponse,
            done: true,
            total_duration: (endTime - startTime) * 1000000, // Convertir en nanosecondes
            eval_count: tokenCount,
          };
        }
      }

      throw new OllamaError(
        'La génération s\'est terminée sans signal de fin',
        'GENERATION_FAILED'
      );
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new OllamaError(
        `Erreur lors de la génération: ${errorMessage}`,
        'GENERATION_FAILED',
        error
      );
    }
  }

  /**
   * Génère un commentaire sans streaming (attend la réponse complète)
   * @param prompt Le prompt à envoyer au modèle
   * @param options Options de génération personnalisées
   */
  async generate(
    prompt: string,
    options?: Partial<GenerationOptions>
  ): Promise<OllamaResponse> {
    // Vérifier la connexion
    if (!this.connectionState.isConnected || !this.connectionState.modelAvailable) {
      await this.testConnection();
      
      if (!this.connectionState.isConnected) {
        throw new OllamaError(
          'Ollama n\'est pas connecté',
          'CONNECTION_FAILED'
        );
      }

      if (!this.connectionState.modelAvailable) {
        throw new OllamaError(
          `Le modèle "${this.config.model}" n'est pas disponible`,
          'MODEL_NOT_FOUND'
        );
      }
    }

    const generationOptions = {
      ...OllamaService.DEFAULT_GENERATION_OPTIONS,
      ...options,
    };

    try {
      const response = await this.withTimeout(
        this.client.generate({
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: generationOptions.temperature,
            top_p: generationOptions.top_p,
            top_k: generationOptions.top_k,
            repeat_penalty: generationOptions.repeat_penalty,
            num_predict: generationOptions.num_predict,
            num_ctx: generationOptions.num_ctx,
          },
        }),
        this.config.timeout,
        'Timeout lors de la génération'
      );

      return {
        ...response,
        created_at: response.created_at.toISOString(),
      } as OllamaResponse;
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new OllamaError(
        `Erreur lors de la génération: ${errorMessage}`,
        'GENERATION_FAILED',
        error
      );
    }
  }

  /**
   * Liste tous les modèles disponibles sur Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.withTimeout(
        fetch(`${this.config.baseUrl}/api/tags`),
        5000,
        'Timeout lors de la récupération des modèles'
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new OllamaError(
        `Impossible de lister les modèles: ${errorMessage}`,
        'CONNECTION_FAILED',
        error
      );
    }
  }

  /**
   * Vérifie si un modèle spécifique est installé
   */
  async isModelInstalled(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.includes(modelName);
    } catch {
      return false;
    }
  }

  /**
   * Met à jour la configuration du service
   */
  updateConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config };
    this.client = new Ollama({ host: this.config.baseUrl });
    // Réinitialiser l'état de connexion
    this.connectionState.isConnected = false;
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Récupère l'état de connexion actuel
   */
  getConnectionState(): OllamaConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Utilitaire pour ajouter un timeout à une promesse
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new OllamaError(timeoutMessage, 'TIMEOUT')),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Nettoie les ressources (si nécessaire)
   */
  dispose(): void {
    // Nettoyage si nécessaire
    this.connectionState = {
      isConnected: false,
      modelAvailable: false,
      availableModels: [],
    };
  }
}

/**
 * Instance singleton du service Ollama
 * Utilisez cette instance pour toutes les interactions avec Ollama
 */
export const ollamaService = new OllamaService();

/**
 * Hook pour réinitialiser le service avec une nouvelle configuration
 */
export function reinitializeOllamaService(config?: Partial<OllamaConfig>): OllamaService {
  const newService = new OllamaService(config);
  return newService;
}

// Made with ❤️ by Bob

// Made with Bob
