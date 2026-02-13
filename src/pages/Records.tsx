// Page des records personnels

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { useRecordsByCategory, useRecordStatistics } from '../hooks/usePersonalRecords';
import { formatDistance, formatDuration, formatSpeed } from '../utils/statistics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { RecordType } from '../types/records';

export function Records() {
  const { recordsByCategory, loading, error } = useRecordsByCategory();
  const { statistics } = useRecordStatistics();
  const [selectedType, setSelectedType] = useState<RecordType | 'all'>('all');

  if (loading) {
    return <Loading message="Chargement des records..." />;
  }

  if (error) {
    return <Alert type="error" title="Erreur" message={error} />;
  }

  const filteredRecords = selectedType === 'all'
    ? recordsByCategory
    : recordsByCategory.map(cat => ({
        ...cat,
        records: cat.records.filter(r => r.type === selectedType),
      })).filter(cat => cat.records.length > 0);

  const formatRecordValue = (record: typeof recordsByCategory[0]['records'][0]) => {
    switch (record.type) {
      case 'distance':
        return formatDistance(record.value);
      case 'speed':
        return `${(record.value * 3.6).toFixed(2)} km/h`;
      case 'time':
        return formatDuration(record.value);
      case 'elevation':
        return `${record.value.toFixed(0)} m`;
      case 'calories':
        return `${record.value.toFixed(0)} kcal`;
      case 'heartRate':
        return `${record.value.toFixed(0)} bpm`;
      default:
        return record.value.toString();
    }
  };

  const formatImprovement = (record: typeof recordsByCategory[0]['records'][0]) => {
    if (!record.improvement || !record.previousValue) return null;

    const percentage = ((record.improvement / record.previousValue) * 100).toFixed(1);
    
    if (record.type === 'time') {
      // Pour le temps, une amélioration est une réduction
      return (
        <span className="text-green-600 dark:text-green-400 text-sm">
          -{formatDuration(record.improvement)} (-{percentage}%)
        </span>
      );
    } else {
      return (
        <span className="text-green-600 dark:text-green-400 text-sm">
          +{formatRecordValue({ ...record, value: record.improvement })} (+{percentage}%)
        </span>
      );
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span>🏆</span>
              Records Personnels
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Vos meilleures performances
            </p>
          </div>
          <Link to="/" className="btn-secondary">
            ← Retour
          </Link>
        </div>

        {/* Statistiques globales */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de records</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {statistics.totalRecords}
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sports</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {Object.keys(statistics.recordsBySport).length}
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dernier record</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    {statistics.lastRecordDate
                      ? format(statistics.lastRecordDate, 'dd MMM yyyy', { locale: fr })
                      : 'Aucun'}
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Filtres */}
        <Card>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedType('time')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'time'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ⏱️ Temps
            </button>
            <button
              onClick={() => setSelectedType('distance')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'distance'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📏 Distance
            </button>
            <button
              onClick={() => setSelectedType('speed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'speed'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ⚡ Vitesse
            </button>
            <button
              onClick={() => setSelectedType('elevation')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'elevation'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🏔️ Dénivelé
            </button>
          </div>
        </Card>

        {/* Liste des records par catégorie */}
        {filteredRecords.length === 0 ? (
          <Alert
            type="info"
            title="Aucun record"
            message="Continuez à vous entraîner pour établir vos premiers records !"
          />
        ) : (
          <div className="space-y-6">
            {filteredRecords.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.records.map((record) => (
                      <Link
                        key={record.id}
                        to={`/activity/${record.activityId}`}
                        className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {record.sport}
                              </span>
                              {record.isNew && (
                                <span className="px-2 py-1 text-xs font-bold bg-yellow-400 text-yellow-900 rounded-full">
                                  NOUVEAU !
                                </span>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {formatRecordValue(record)}
                            </p>
                            {formatImprovement(record) && (
                              <p className="mt-1">{formatImprovement(record)}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {format(new Date(record.activityDate), 'dd MMMM yyyy', { locale: fr })}
                            </p>
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
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Records récents */}
        {statistics && statistics.recentRecords.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎯 Records récents
            </h3>
            <div className="space-y-2">
              {statistics.recentRecords.map((record) => (
                <Link
                  key={record.id}
                  to={`/activity/${record.activityId}`}
                  className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {record.sport} - {formatRecordValue(record)}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(record.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    {record.isNew && (
                      <span className="text-2xl">🆕</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

// Made with Bob