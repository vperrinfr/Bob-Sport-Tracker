import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/activity/FileUpload';
import { Alert } from '../components/ui/Alert';
import type { Activity } from '../types/activity';

export function UploadPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (activity: Activity) => {
    setSuccess(activity);
    setError(null);
    
    // Rediriger vers la page de détails après 2 secondes
    setTimeout(() => {
      navigate(`/activities/${activity.id}`);
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Importer une activité
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Importez vos fichiers TCX depuis votre montre GPS ou application sportive
        </p>
      </div>

      {/* Messages */}
      {success && (
        <Alert
          type="success"
          title="Import réussi !"
          message={
            <div>
              <p>
                Votre activité <strong>{success.sport}</strong> a été importée avec succès.
              </p>
              <p className="mt-2 text-sm">
                Redirection vers les détails...
              </p>
            </div>
          }
          onClose={() => setSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Erreur d'import"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Upload Component */}
      <FileUpload onUploadSuccess={handleSuccess} onUploadError={handleError} />

      {/* Instructions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comment obtenir vos fichiers TCX ?
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Garmin Connect
              </p>
              <p>
                Connectez-vous à Garmin Connect, sélectionnez une activité, puis cliquez sur
                l'icône d'engrenage et choisissez "Exporter au format TCX".
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Strava
              </p>
              <p>
                Sur Strava, allez dans une activité, cliquez sur les trois points en haut à
                droite, puis "Exporter TCX".
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Autres applications
              </p>
              <p>
                La plupart des applications sportives (Polar Flow, Suunto, etc.) permettent
                d'exporter les activités au format TCX dans les paramètres d'export.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Format Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">À propos du format TCX</p>
            <p>
              Le format TCX (Training Center XML) est un format standard créé par Garmin pour
              stocker les données d'entraînement. Il contient toutes les informations de votre
              activité : position GPS, fréquence cardiaque, cadence, altitude, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob