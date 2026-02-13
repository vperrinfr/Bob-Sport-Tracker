import { useActivities } from '../hooks/useActivities';
import { AnimatedStatCard } from '../components/ui/AnimatedStatCard';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Link } from 'react-router-dom';
import { calculateAggregateStatistics, formatDistance, formatDuration } from '../utils/statistics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StravaStatusBadge } from '../components/strava/StravaStatusBadge';
import { RecordBadge } from '../components/records/RecordBadge';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { activities, loading, error } = useActivities();

  if (loading) {
    return <Loading message="Chargement du tableau de bord..." />;
  }

  if (error) {
    return <Alert type="error" title="Erreur" message={error} />;
  }

  const stats = calculateAggregateStatistics(activities);
  const recentActivities = activities.slice(0, 5);

  // Calculer les statistiques par sport
  const sportStats = activities.reduce((acc, activity) => {
    if (!acc[activity.sport]) {
      acc[activity.sport] = { count: 0, distance: 0 };
    }
    acc[activity.sport].count++;
    acc[activity.sport].distance += activity.distanceMeters;
    return acc;
  }, {} as Record<string, { count: number; distance: number }>);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Vue d'ensemble de vos activités sportives
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RecordBadge />
            <StravaStatusBadge />
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
                Importer une activité
              </Link>
            </motion.div>
          </div>
        </motion.div>

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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune activité
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Commencez par importer votre première activité
          </p>
          <Link to="/upload" className="btn-primary">
            Importer un fichier TCX
          </Link>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedStatCard
              title="Total d'activités"
              value={stats.totalActivities}
              delay={0.1}
              icon={
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
            />
            <AnimatedStatCard
              title="Distance totale"
              value={formatDistance(stats.totalDistance)}
              delay={0.2}
              icon={
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              }
            />
            <AnimatedStatCard
              title="Temps total"
              value={formatDuration(stats.totalTime)}
              delay={0.3}
              icon={
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <AnimatedStatCard
              title="Calories brûlées"
              value={stats.totalCalories.toLocaleString()}
              subtitle="kcal"
              delay={0.4}
              icon={
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
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              }
            />
          </div>

          {/* Statistiques par sport */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Activités par sport
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(sportStats).map(([sport, data], index) => (
                <motion.div
                  key={sport}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                      {sport}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.count} activité{data.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatDistance(data.distance)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Activités récentes */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Activités récentes
              </h2>
              <Link
                to="/activities"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                >
                  <Link
                    to={`/activities/${activity.id}`}
                    className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:shadow-md hover:-translate-y-1"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-medium bg-primary-600 dark:bg-primary-900 text-white dark:text-primary-300 rounded">
                          {activity.sport}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(activity.startTime), 'PPP', { locale: fr })}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-700 dark:text-gray-300">
                        <span>{formatDistance(activity.distanceMeters)}</span>
                        <span>{formatDuration(activity.totalTimeSeconds)}</span>
                        {activity.calories && <span>{activity.calories} kcal</span>}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
      </div>
    </PageTransition>
  );
}

// Made with Bob