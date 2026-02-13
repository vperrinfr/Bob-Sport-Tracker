import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Activity, ChartDataPoint } from '../../types/activity';
import { formatDuration } from '../../utils/statistics';

interface ActivityChartProps {
  activity: Activity;
  dataType: 'speed' | 'heartRate' | 'altitude' | 'cadence';
}

export function ActivityChart({ activity, dataType }: ActivityChartProps) {
  // Préparer les données pour le graphique
  const chartData: ChartDataPoint[] = [];
  let startTime = activity.startTime.getTime();

  activity.laps.forEach((lap) => {
    lap.trackpoints.forEach((tp) => {
      const timeOffset = (tp.time.getTime() - startTime) / 1000; // en secondes
      
      let value: number | undefined;
      switch (dataType) {
        case 'speed':
          value = tp.speed ? tp.speed * 3.6 : undefined; // Convertir m/s en km/h
          break;
        case 'heartRate':
          value = tp.heartRate;
          break;
        case 'altitude':
          value = tp.altitude;
          break;
        case 'cadence':
          value = tp.cadence;
          break;
      }

      if (value !== undefined) {
        chartData.push({
          time: timeOffset,
          value,
          label: formatDuration(timeOffset),
        });
      }
    });
  });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Aucune donnée disponible pour ce type de graphique
      </div>
    );
  }

  const config = {
    speed: {
      title: 'Vitesse',
      unit: 'km/h',
      color: '#0ea5e9',
      yAxisLabel: 'Vitesse (km/h)',
    },
    heartRate: {
      title: 'Fréquence cardiaque',
      unit: 'bpm',
      color: '#ef4444',
      yAxisLabel: 'FC (bpm)',
    },
    altitude: {
      title: 'Altitude',
      unit: 'm',
      color: '#10b981',
      yAxisLabel: 'Altitude (m)',
    },
    cadence: {
      title: 'Cadence',
      unit: 'rpm',
      color: '#f59e0b',
      yAxisLabel: 'Cadence (rpm)',
    },
  };

  const currentConfig = config[dataType];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => formatDuration(value)}
            className="text-xs text-gray-600 dark:text-gray-400"
            label={{ value: 'Temps', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            className="text-xs text-gray-600 dark:text-gray-400"
            label={{ value: currentConfig.yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            labelFormatter={(value) => `Temps: ${formatDuration(value as number)}`}
            formatter={(value) => typeof value === 'number' ? [`${value.toFixed(1)} ${currentConfig.unit}`, currentConfig.title] : ['-', currentConfig.title]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={currentConfig.color}
            strokeWidth={2}
            dot={false}
            name={currentConfig.title}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Made with Bob