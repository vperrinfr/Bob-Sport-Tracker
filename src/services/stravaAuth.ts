import type { StravaTokens, StravaAthlete, StravaConfig, StravaAuthState } from '../types/strava';

/**
 * Service d'authentification Strava avec OAuth2
 * 
 * Pour utiliser ce service, vous devez :
 * 1. Créer une application sur https://www.strava.com/settings/api
 * 2. Configurer l'URL de redirection (ex: http://localhost:5173/strava/callback)
 * 3. Obtenir votre Client ID et Client Secret
 */

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

// Clés de stockage
const STORAGE_KEYS = {
  TOKENS: 'strava_tokens',
  ATHLETE: 'strava_athlete',
  CONFIG: 'strava_config',
  LAST_SYNC: 'strava_last_sync',
};

export class StravaAuthService {
  private static config: StravaConfig | null = null;

  /**
   * Configure les paramètres Strava
   */
  static setConfig(config: StravaConfig): void {
    this.config = config;
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  /**
   * Récupère la configuration
   */
  static getConfig(): StravaConfig | null {
    if (this.config) return this.config;

    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (stored) {
      this.config = JSON.parse(stored);
      return this.config;
    }

    return null;
  }

  /**
   * Vérifie si la configuration est complète
   */
  static isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config?.clientId && config?.clientSecret && config?.redirectUri);
  }

  /**
   * Génère l'URL d'autorisation Strava
   */
  static getAuthorizationUrl(): string {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Configuration Strava manquante. Appelez setConfig() d\'abord.');
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'read,activity:read_all,activity:write',
      approval_prompt: 'auto',
    });

    return `${STRAVA_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Redirige vers la page d'autorisation Strava
   */
  static authorize(): void {
    const url = this.getAuthorizationUrl();
    window.location.href = url;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  static async exchangeToken(code: string): Promise<StravaTokens> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Configuration Strava manquante');
    }

    try {
      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'échange du token');
      }

      const data = await response.json();
      
      const tokens: StravaTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };

      // Sauvegarder les tokens
      await this.saveTokens(tokens);

      // Sauvegarder les infos de l'athlète
      if (data.athlete) {
        await this.saveAthlete(data.athlete);
      }

      return tokens;
    } catch (error) {
      console.error('Erreur lors de l\'échange du token:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit le token d'accès
   */
  static async refreshAccessToken(): Promise<StravaTokens> {
    const config = this.getConfig();
    const tokens = await this.getTokens();

    if (!config || !tokens) {
      throw new Error('Configuration ou tokens manquants');
    }

    try {
      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du rafraîchissement du token');
      }

      const data = await response.json();
      
      const newTokens: StravaTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };

      await this.saveTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le token est expiré et le rafraîchit si nécessaire
   */
  static async ensureValidToken(): Promise<string> {
    const tokens = await this.getTokens();
    
    if (!tokens) {
      throw new Error('Non authentifié');
    }

    // Vérifier si le token expire dans moins de 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = tokens.expires_at - now;

    if (expiresIn < 300) {
      // Token expiré ou expire bientôt, le rafraîchir
      const newTokens = await this.refreshAccessToken();
      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Sauvegarde les tokens
   */
  private static async saveTokens(tokens: StravaTokens): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  }

  /**
   * Récupère les tokens
   */
  static async getTokens(): Promise<StravaTokens | null> {
    const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Sauvegarde les informations de l'athlète
   */
  private static async saveAthlete(athlete: StravaAthlete): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ATHLETE, JSON.stringify(athlete));
  }

  /**
   * Récupère les informations de l'athlète
   */
  static async getAthlete(): Promise<StravaAthlete | null> {
    const stored = localStorage.getItem(STORAGE_KEYS.ATHLETE);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Récupère les informations de l'athlète depuis l'API
   */
  static async fetchAthlete(): Promise<StravaAthlete> {
    const accessToken = await this.ensureValidToken();

    try {
      const response = await fetch(`${STRAVA_API_URL}/athlete`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des informations de l\'athlète');
      }

      const athlete = await response.json();
      await this.saveAthlete(athlete);
      return athlete;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'athlète:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  static async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens();
    return !!tokens;
  }

  /**
   * Récupère l'état d'authentification complet
   */
  static async getAuthState(): Promise<StravaAuthState> {
    const tokens = await this.getTokens();
    const athlete = await this.getAthlete();
    const lastSyncStr = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

    return {
      isAuthenticated: !!tokens,
      athlete,
      tokens,
      lastSync,
    };
  }

  /**
   * Met à jour la date de dernière synchronisation
   */
  static async updateLastSync(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Déconnexion
   */
  static async logout(): Promise<void> {
    // Révoquer le token sur Strava
    try {
      const accessToken = await this.ensureValidToken();
      await fetch(`${STRAVA_TOKEN_URL}/deauthorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la révocation du token:', error);
    }

    // Supprimer les données locales
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.ATHLETE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }

  /**
   * Effectue une requête API authentifiée
   */
  static async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.ensureValidToken();

    const response = await fetch(`${STRAVA_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erreur API Strava: ${response.status}`);
    }

    return response.json();
  }
}

// Made with Bob