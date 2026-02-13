import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../components/ui/Loading';

/**
 * Page de callback OAuth Strava
 * Redirige automatiquement vers la page de configuration après traitement
 */
export function StravaCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const scope = searchParams.get('scope');

    // Construire l'URL de redirection avec les paramètres
    const params = new URLSearchParams();
    if (code) params.append('code', code);
    if (error) params.append('error', error);
    if (scope) params.append('scope', scope);

    // Rediriger vers la page de configuration
    navigate(`/strava/settings?${params.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading message="Connexion à Strava en cours..." />
    </div>
  );
}

// Made with Bob