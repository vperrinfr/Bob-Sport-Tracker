import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Loading } from '../components/ui/Loading';
import { useStravaAuth, useStravaSync } from '../hooks/useStravaSync';
import { StravaAuthService } from '../services/stravaAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function StravaSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authState, loading: authLoading, login, logout, handleCallback, reload } = useStravaAuth();
  const { 
    syncing, 
    syncResult, 
    progress,
    newActivitiesCount,
    syncRecentActivities, 
    syncAllActivities,
    checkForNewActivities,
    deleteAllStravaActivities 
  } = useStravaSync();

  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/strava/callback',
  });
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Charger la configuration existante
  useEffect(() => {
    const existingConfig = StravaAuthService.getConfig();
    if (existingConfig) {
      setConfig(existingConfig);
    }
  }, []);

  // Gérer le callback OAuth
  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Autorisation refusée');
      navigate('/strava/settings', { replace: true });
      return;
    }

    if (code) {
      handleCallback(code)
        .then(() => {
          setSuccess('Connexion réussie !');
          navigate('/strava/settings', { replace: true });
        })
        .catch((err) => {
          setError(err.message || 'Erreur lors de la connexion');
          navigate('/strava/settings', { replace: true });
        });
    }
  }, [searchParams, handleCallback, navigate]);

  // Vérifier les nouvelles activités au chargement
  useEffect(() => {
    if (authState.isAuthenticated) {
      checkForNewActivities();
    }
  }, [authState.isAuthenticated, checkForNewActivities]);

  const handleSaveConfig = () => {
    if (!config.clientId || !config.clientSecret) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    StravaAuthService.setConfig(config);
    setSuccess('Configuration sauvegardée !');
    setShowConfig(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLogin = () => {
    if (!StravaAuthService.isConfigured()) {
      setError('Veuillez d\'abord configurer vos clés API Strava');
      setShowConfig(true);
      return;
    }
    login();
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSuccess('Déconnexion réussie');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la déconnexion');
    }
  };

  const handleSyncRecent = async () => {
    setError(null);
    setSuccess(null);
    const result = await syncRecentActivities();
    if (result.success) {
      setSuccess(`${result.activitiesImported} activités importées, ${result.activitiesSkipped} ignorées`);
      setTimeout(() => {
        reload();
        navigate('/activities');
      }, 2000);
    } else {
      setError(result.errors.join(', '));
    }
  };

  const handleSyncAll = async () => {
    if (!confirm('Voulez-vous vraiment synchroniser toutes vos activités ? Cela peut prendre du temps.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    const result = await syncAllActivities();
    if (result.success) {
      setSuccess(`${result.activitiesImported} activités importées, ${result.activitiesSkipped} ignorées`);
      setTimeout(() => {
        reload();
        navigate('/activities');
      }, 2000);
    } else {
      setError(result.errors.join(', '));
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Voulez-vous vraiment supprimer toutes les activités Strava de la base de données ?')) {
      return;
    }
    try {
      setDeleting(true);
      const count = await deleteAllStravaActivities();
      setSuccess(`${count} activités Strava supprimées`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return <Loading message="Chargement..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Intégration Strava</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Retour
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Configuration API */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Configuration API</h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showConfig ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {showConfig && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre Client ID Strava"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre Client Secret Strava"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URI
              </label>
              <input
                type="text"
                value={config.redirectUri}
                onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Utilisez cette URL dans les paramètres de votre application Strava
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sauvegarder la configuration
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h3 className="font-semibold text-sm mb-2">Comment obtenir vos clés API ?</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Allez sur <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">strava.com/settings/api</a></li>
                <li>Créez une nouvelle application</li>
                <li>Copiez le Client ID et Client Secret</li>
                <li>Ajoutez l'URL de redirection ci-dessus dans les paramètres</li>
              </ol>
            </div>
          </div>
        )}
      </Card>

      {/* Statut de connexion */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Connexion</h2>
        
        {!authState.isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Connectez-vous à Strava pour synchroniser vos activités automatiquement.
            </p>
            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
              </svg>
              Se connecter avec Strava
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {authState.athlete?.profile && (
                <img
                  src={authState.athlete.profile}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">
                  {authState.athlete?.firstname} {authState.athlete?.lastname}
                </p>
                <p className="text-sm text-gray-600">@{authState.athlete?.username}</p>
                {authState.lastSync && (
                  <p className="text-sm text-gray-500">
                    Dernière sync: {format(authState.lastSync, 'Pp', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </Card>

      {/* Synchronisation */}
      {authState.isAuthenticated && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Synchronisation</h2>
          
          {newActivitiesCount > 0 && (
            <Alert
              type="info"
              message={`${newActivitiesCount} nouvelle(s) activité(s) disponible(s)`}
            />
          )}

          {syncing && (
            <div className="mb-4">
              <Loading message="Synchronisation en cours..." />
              {progress && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {progress.current} / {progress.total} activités traitées
                </p>
              )}
            </div>
          )}

          {syncResult && !syncing && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="font-semibold">Résultat de la synchronisation:</p>
              <ul className="text-sm space-y-1 mt-2">
                <li>✅ {syncResult.activitiesImported} activités importées</li>
                <li>⏭️ {syncResult.activitiesSkipped} activités ignorées (déjà présentes)</li>
                {syncResult.errors.length > 0 && (
                  <li className="text-red-600">❌ {syncResult.errors.length} erreurs</li>
                )}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSyncRecent}
              disabled={syncing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Synchroniser les activités récentes (30 jours)
            </button>

            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Synchroniser toutes les activités
            </button>

            <button
              onClick={handleDeleteAll}
              disabled={syncing || deleting}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {deleting ? 'Suppression...' : 'Supprimer toutes les activités Strava'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// Made with Bob