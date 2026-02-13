// Page de configuration et visualisation des zones d'entraînement

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { useTrainingZones, useZoneStatistics } from '../hooks/useTrainingZones';
import { motion } from 'framer-motion';
import { ZONE_COLORS, ZONE_NAMES } from '../types/trainingZones';
import type { ZoneNumber } from '../types/trainingZones';
import toast from 'react-hot-toast';

export function TrainingZones() {
  const { settings, zones, loading, configureByAge, configureByKarvonen, resetToDefaults } = useTrainingZones();
  const { statistics, recommendations, loading: statsLoading } = useZoneStatistics();
  
  const [showConfig, setShowConfig] = useState(!settings);
  const [configMethod, setConfigMethod] = useState<'age' | 'karvonen'>('age');
  const [age, setAge] = useState(30);
  const [restingHR, setRestingHR] = useState(60);

  const handleSaveConfig = () => {
    try {
      if (configMethod === 'age') {
        configureByAge(age);
        toast.success('Configuration sauvegardée !');
      } else {
        configureByKarvonen(age, restingHR);
        toast.success('Configuration sauvegardée avec méthode Karvonen !');
      }
      setShowConfig(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration ?')) {
      resetToDefaults();
      setShowConfig(true);
      toast.success('Configuration réinitialisée');
    }
  };

  if (loading) {
    return <Loading message="Chargement des zones d'entraînement..." />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span>💓</span>
              Zones d'Entraînement
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Optimisez votre entraînement avec les zones de fréquence cardiaque
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="btn-secondary"
            >
              ⚙️ Configuration
            </button>
            <Link to="/" className="btn-secondary">
              ← Retour
            </Link>
          </div>
        </div>

        {/* Configuration */}
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration des zones
              </h3>

              <div className="space-y-4">
                {/* Méthode de calcul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Méthode de calcul
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setConfigMethod('age')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                        configMethod === 'age'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Formule simple</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">220 - âge</div>
                    </button>
                    <button
                      onClick={() => setConfigMethod('karvonen')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                        configMethod === 'karvonen'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Méthode Karvonen</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Plus précise</div>
                    </button>
                  </div>
                </div>

                {/* Âge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votre âge
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                    min="10"
                    max="100"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    FC max estimée : {220 - age} bpm
                  </p>
                </div>

                {/* FC repos (Karvonen) */}
                {configMethod === 'karvonen' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fréquence cardiaque au repos
                    </label>
                    <input
                      type="number"
                      value={restingHR}
                      onChange={(e) => setRestingHR(parseInt(e.target.value) || 60)}
                      min="30"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mesurez votre FC au réveil, au calme
                    </p>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-2">
                  <button onClick={handleSaveConfig} className="btn-primary flex-1">
                    Sauvegarder
                  </button>
                  {settings && (
                    <button onClick={handleReset} className="btn-secondary">
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Les 5 zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {zones.map((zone, index) => (
            <motion.div
              key={zone.zone}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="text-center">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                    style={{ backgroundColor: zone.color }}
                  >
                    Z{zone.zone}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {zone.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {zone.minHR} - {zone.maxHR} bpm
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {zone.minPercent}% - {zone.maxPercent}%
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Description des zones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <Card key={zone.zone}>
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                >
                  Z{zone.zone}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                    {zone.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {zone.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <p className="font-semibold mb-1">Bénéfices :</p>
                    <ul className="list-disc list-inside space-y-1">
                      {zone.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Statistiques globales */}
        {!statsLoading && statistics && (
          <>
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Répartition de vos entraînements
              </h3>
              <div className="space-y-3">
                {([1, 2, 3, 4, 5] as ZoneNumber[]).map((zoneNum) => {
                  const percentage = statistics.averagePercentages[`zone${zoneNum}` as keyof typeof statistics.averagePercentages];
                  return (
                    <div key={zoneNum}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Zone {zoneNum} - {ZONE_NAMES[zoneNum]}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: ZONE_COLORS[zoneNum],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Types d'entraînement */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🎯 Types d'entraînement
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statistics.trainingTypeDistribution).map(([type, count]) => {
                  if (count === 0) return null;
                  const labels: Record<string, string> = {
                    recovery: 'Récupération',
                    endurance: 'Endurance',
                    tempo: 'Tempo',
                    threshold: 'Seuil',
                    interval: 'Intervalles',
                    mixed: 'Mixte',
                    unknown: 'Inconnu',
                  };
                  return (
                    <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{labels[type]}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recommandations */}
            {recommendations.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  💡 Recommandations
                </h3>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <p className="text-sm text-gray-900 dark:text-white">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

// Made with Bob