// Page des statistiques par période

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { usePeriodStatistics, usePeriodComparison, useEvolutionData } from '../hooks/usePeriodStatistics';
import type { PeriodType } from '../types/statistics';
import { formatDistance, formatDuration } from '../utils/statistics';
import { format, addWeeks, addMonths, addYears, subWeeks, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Statistics() {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { statistics, loading: statsLoading } = usePeriodStatistics(period, currentDate);
  const { comparison, loading: compLoading } = usePeriodComparison(period, currentDate);
  const { evolution: distanceEvolution } = useEvolutionData('distance', period, 12);
  const { evolution: activitiesEvolution } = useEvolutionData('activities', period, 12);

  const loading = statsLoading || compLoading;

  const handlePreviousPeriod = () => {
    switch (period) {
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (period) {
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return `Semaine du ${format(statistics?.dateRange.start || currentDate, 'dd MMM', { locale: fr })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case 'year':
        return format(currentDate, 'yyyy', { locale: fr });
      default:
        return '';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading && !statistics) {
    return <Loading message="Chargement des statistiques..." />;
  }

  if (!statistics) {
    return (
      <Alert
        type="info"
        title="Aucune donnée"
        message="Aucune activité trouvée pour cette période"
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Statistiques
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Analyse de vos performances par période
            </p>
          </div>
          <Link to="/" className="btn-secondary">
            ← Retour
          </Link>
        </div>

        {/* Sélecteur de période */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'week'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'year'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Année
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPeriod}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Période précédente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleToday}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Aujourd'hui
              </button>

              <button
                onClick={handleNextPeriod}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Période suivante"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getPeriodLabel()}
            </h2>
          </div>
        </Card>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Distance totale</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatDistance(statistics.totalDistance)}
                </p>
                {comparison && (
                  <p className={`text-sm mt-2 ${getChangeColor(comparison.changes.distance)}`}>
                    {getChangeIcon(comparison.changes.distance)} {Math.abs(comparison.changes.distance).toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Temps total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatDuration(statistics.totalTime)}
                </p>
                {comparison && (
                  <p className={`text-sm mt-2 ${getChangeColor(comparison.changes.time)}`}>
                    {getChangeIcon(comparison.changes.time)} {Math.abs(comparison.changes.time).toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Activités</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {statistics.totalActivities}
                </p>
                {comparison && (
                  <p className={`text-sm mt-2 ${getChangeColor(comparison.changes.activities)}`}>
                    {getChangeIcon(comparison.changes.activities)} {Math.abs(comparison.changes.activities).toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Vitesse moyenne</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {(statistics.averageSpeed * 3.6).toFixed(1)} <span className="text-lg">km/h</span>
                </p>
                {comparison && (
                  <p className={`text-sm mt-2 ${getChangeColor(comparison.changes.speed)}`}>
                    {getChangeIcon(comparison.changes.speed)} {Math.abs(comparison.changes.speed).toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Graphique d'évolution de la distance */}
        {distanceEvolution && distanceEvolution.data.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Évolution de la distance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={distanceEvolution.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="label" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg)', 
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Distance (km)"
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Graphique du nombre d'activités */}
        {activitiesEvolution && activitiesEvolution.data.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Nombre d'activités
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activitiesEvolution.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="label" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg)', 
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Activités"
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Répartition par sport */}
        {Object.keys(statistics.sportBreakdown).length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🏃 Répartition par sport
            </h3>
            <div className="space-y-4">
              {Object.entries(statistics.sportBreakdown).map(([sport, data]) => (
                <div key={sport}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{sport}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.count} activité{data.count > 1 ? 's' : ''} · {formatDistance(data.distance)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(data.distance / statistics.totalDistance) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

// Made with Bob