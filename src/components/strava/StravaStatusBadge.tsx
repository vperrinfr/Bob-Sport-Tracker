import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStravaAuth, useStravaSync } from '../../hooks/useStravaSync';

export function StravaStatusBadge() {
  const { authState } = useStravaAuth();
  const { checkForNewActivities } = useStravaSync();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (authState.isAuthenticated) {
      checkForNewActivities().then(setNewCount);
    }
  }, [authState.isAuthenticated, checkForNewActivities]);

  if (!authState.isAuthenticated) {
    return (
      <Link
        to="/strava/settings"
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
        Connecter Strava
      </Link>
    );
  }

  return (
    <Link
      to="/strava/settings"
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
      </svg>
      <span className="font-medium">Strava connecté</span>
      {newCount > 0 && (
        <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full">
          {newCount} nouvelle{newCount > 1 ? 's' : ''}
        </span>
      )}
    </Link>
  );
}

// Made with Bob