import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useActivity } from '../hooks/useActivities';
import { useCommentaryGenerator } from '../hooks/useCommentaryGenerator';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Card, StatCard } from '../components/ui/Card';
import { ActivityChart } from '../components/charts/ActivityChart';
import { ActivityMap } from '../components/map/ActivityMap';
import { CommentaryDisplay, CommentaryLoadingState, CommentaryErrorState, CommentaryEmptyState } from '../components/commentary/CommentaryDisplay';
import { ExportService } from '../services/exportService';
import { calculateStatistics, formatDistance, formatDuration, formatSpeed, formatPace } from '../utils/statistics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activity, loading, error } = useActivity(id!);
  const [activeChart, setActiveChart] = useState<'speed' | 'heartRate' | 'altitude' | 'cadence'>('speed');
  
  // Hook pour générer le commentaire
  const {
    commentary,
    isGenerating,
    error: commentaryError,
    streamingState,
    generate: generateCommentary,
  } = useCommentaryGenerator();

  if (loading) {
    return <Loading message="Chargement de l'activité..." />;
  }

  if (error || !activity) {
    return (
      <div className="space-y-4">
        <Alert
          type="error"
          title="Erreur"
          message={error || "Activité introuvable"}
        />
        <Link to="/activities" className="btn-primary">
          ← Retour aux activités
        </Link>
      </div>
    );
  }

  const stats = calculateStatistics(activity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Link
              to="/activities"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <span className="px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
              {activity.sport}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activity.sport} - {format(new Date(activity.startTime), 'PPP', { locale: fr })}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {format(new Date(activity.startTime), 'HH:mm', { locale: fr })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => ExportService.downloadActivityAsCSV(activity)}
            className="btn-secondary"
            title="Exporter en CSV"
          >
            <svg
              className="w-5 h-5 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            CSV
          </button>
          <button
            onClick={() => ExportService.downloadActivityAsJSON(activity)}
            className="btn-secondary"
            title="Exporter en JSON"
          >
            <svg
              className="w-5 h-5 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            JSON
          </button>
          <button
            onClick={() => navigate('/activities')}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Distance"
          value={formatDistance(stats.totalDistance)}
          icon={
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
        <StatCard
          title="Durée"
          value={formatDuration(stats.totalTime)}
          icon={
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Vitesse moyenne"
          value={formatSpeed(stats.averageSpeed)}
          subtitle={stats.averagePace ? formatPace(stats.averagePace) : undefined}
          icon={
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          title="Calories"
          value={stats.totalCalories?.toLocaleString() || 'N/A'}
          subtitle="kcal"
          icon={
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
          }
        />
      </div>

      {/* Commentaire du coach */}
      <Card>
        {isGenerating ? (
          <CommentaryLoadingState />
        ) : commentaryError ? (
          <CommentaryErrorState
            error={commentaryError}
            onRetry={() => generateCommentary(activity)}
          />
        ) : commentary ? (
          <CommentaryDisplay
            commentary={commentary}
            streamingState={streamingState}
            showMetadata={true}
            showActions={true}
            onRegenerate={() => generateCommentary(activity)}
          />
        ) : (
          <CommentaryEmptyState
            onGenerate={() => generateCommentary(activity)}
          />
        )}
      </Card>

      {/* Carte */}
      <Card title="Parcours" subtitle="Tracé GPS de votre activité">
        <ActivityMap activity={activity} height="500px" />
      </Card>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vitesse */}
        <Card title="Vitesse">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatSpeed(stats.averageSpeed)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maximum</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatSpeed(stats.maxSpeed)}
              </span>
            </div>
            {stats.averagePace && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Allure moyenne</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPace(stats.averagePace)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Fréquence cardiaque */}
        {stats.averageHeartRate && (
          <Card title="Fréquence cardiaque">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(stats.averageHeartRate)} bpm
                </span>
              </div>
              {stats.maxHeartRate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Maximum</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(stats.maxHeartRate)} bpm
                  </span>
                </div>
              )}
              {stats.minHeartRate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Minimum</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(stats.minHeartRate)} bpm
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Altitude */}
        {stats.elevationGain && (
          <Card title="Altitude">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dénivelé positif</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(stats.elevationGain)} m
                </span>
              </div>
              {stats.elevationLoss && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Dénivelé négatif</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(stats.elevationLoss)} m
                  </span>
                </div>
              )}
              {stats.maxAltitude && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Altitude max</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(stats.maxAltitude)} m
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cadence */}
        {stats.averageCadence && (
          <Card title="Cadence">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(stats.averageCadence)} rpm
                </span>
              </div>
              {stats.maxCadence && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Maximum</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(stats.maxCadence)} rpm
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Graphiques */}
      <Card title="Graphiques" subtitle="Évolution des métriques pendant l'activité">
        <div className="space-y-4">
          {/* Sélecteur de graphique */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveChart('speed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeChart === 'speed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Vitesse
            </button>
            {stats.averageHeartRate && (
              <button
                onClick={() => setActiveChart('heartRate')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeChart === 'heartRate'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Fréquence cardiaque
              </button>
            )}
            {stats.elevationGain && (
              <button
                onClick={() => setActiveChart('altitude')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeChart === 'altitude'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Altitude
              </button>
            )}
            {stats.averageCadence && (
              <button
                onClick={() => setActiveChart('cadence')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeChart === 'cadence'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Cadence
              </button>
            )}
          </div>

          {/* Graphique actif */}
          <ActivityChart activity={activity} dataType={activeChart} />
        </div>
      </Card>

      {/* Notes */}
      {activity.notes && (
        <Card title="Notes">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {activity.notes}
          </p>
        </Card>
      )}

      {/* Informations sur l'appareil */}
      {activity.creator && (
        <Card title="Informations sur l'appareil">
          <div className="space-y-2 text-sm">
            {activity.creator.name && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Appareil</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {activity.creator.name}
                </span>
              </div>
            )}
            {activity.creator.version && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {activity.creator.version}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// Made with Bob