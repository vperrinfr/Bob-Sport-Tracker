import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { formatDistance, formatDuration, formatSpeed } from '../utils/statistics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ActivityFilter } from '../types/activity';
import { PageTransition } from '../components/ui/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function ActivitiesList() {
  const [filters, setFilters] = useState<ActivityFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const { activities, loading, error, deleteActivity } = useActivities(filters);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id);
      setDeleteConfirm(null);
      toast.success('Activité supprimée avec succès');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleFilterChange = (key: keyof ActivityFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  if (loading) {
    return <Loading message="Chargement des activités..." />;
  }

  if (error) {
    return <Alert type="error" title="Erreur" message={error} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mes activités
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {activities.length} activité{activities.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${hasActiveFilters ? 'ring-2 ring-primary-500' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtres
          </motion.button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/upload" className="btn-primary">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouvelle activité
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Filtres */}
      {showFilters && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtres
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sport
              </label>
              <select
                className="input"
                value={filters.sport || ''}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
              >
                <option value="">Tous les sports</option>
                <option value="Running">Course à pied</option>
                <option value="Biking">Vélo</option>
                <option value="Cycling">Cyclisme</option>
                <option value="Walking">Marche</option>
                <option value="Hiking">Randonnée</option>
                <option value="Swimming">Natation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recherche
              </label>
              <input
                type="text"
                className="input"
                placeholder="Rechercher dans les notes..."
                value={filters.searchQuery || ''}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Distance min (km)
              </label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={filters.minDistance ? filters.minDistance / 1000 : ''}
                onChange={(e) =>
                  handleFilterChange('minDistance', e.target.value ? parseFloat(e.target.value) * 1000 : undefined)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Liste des activités */}
      {activities.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune activité trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {hasActiveFilters
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par importer votre première activité'}
          </p>
          {!hasActiveFilters && (
            <Link to="/upload" className="btn-primary">
              Importer un fichier TCX
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{
                y: -4,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-start justify-between">
                <Link
                  to={`/activities/${activity.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                      {activity.sport}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(activity.startTime), 'PPP à HH:mm', {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Distance
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDistance(activity.distanceMeters)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Durée
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDuration(activity.totalTimeSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Vitesse moy.
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatSpeed(
                          activity.distanceMeters / activity.totalTimeSeconds
                        )}
                      </p>
                    </div>
                    {activity.calories && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Calories
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {activity.calories} kcal
                        </p>
                      </div>
                    )}
                  </div>

                  {activity.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {activity.notes}
                    </p>
                  )}
                </Link>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    to={`/activities/${activity.id}`}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(activity.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirmation de suppression */}
              {deleteConfirm === activity.id && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Êtes-vous sûr de vouloir supprimer cette activité ?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </PageTransition>
  );
}

// Made with Bob