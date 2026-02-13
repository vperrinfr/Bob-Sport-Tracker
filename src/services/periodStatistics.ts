// Service pour les statistiques par période

import type { Activity } from '../types/activity';
import type {
  PeriodType,
  DateRange,
  PeriodStatistics,
  ComparisonData,
  EvolutionMetric,
  TrendData,
  WeeklyBreakdown,
  MonthlyBreakdown,
  YearlyBreakdown,
  ActivityHeatmap,
} from '../types/statistics';
import {
  getWeekBounds,
  getMonthBounds,
  getYearBounds,
  getPreviousPeriodBounds,
  filterActivitiesByDateRange,
  groupActivitiesByWeek,
  groupActivitiesByMonth,
  groupActivitiesByYear,
  groupActivitiesByDay,
} from '../utils/periodCalculations';
import { calculateStatistics } from '../utils/statistics';
import { getWeek, getYear, getMonth } from 'date-fns';

/**
 * Calcule les statistiques pour une période donnée
 */
export function calculatePeriodStats(
  activities: Activity[],
  period: PeriodType,
  date: Date = new Date()
): PeriodStatistics {
  let dateRange: DateRange;
  
  switch (period) {
    case 'week':
      dateRange = getWeekBounds(date);
      break;
    case 'month':
      dateRange = getMonthBounds(date);
      break;
    case 'year':
      dateRange = getYearBounds(date);
      break;
    case 'all':
      dateRange = {
        start: new Date(Math.min(...activities.map(a => new Date(a.startTime).getTime()))),
        end: new Date(Math.max(...activities.map(a => new Date(a.startTime).getTime()))),
      };
      break;
    default:
      dateRange = getWeekBounds(date);
  }
  
  const periodActivities = filterActivitiesByDateRange(activities, dateRange);
  
  return aggregateActivities(periodActivities, period, dateRange);
}

/**
 * Agrège les statistiques d'un ensemble d'activités
 */
function aggregateActivities(
  activities: Activity[],
  period: PeriodType,
  dateRange: DateRange
): PeriodStatistics {
  const totalDistance = activities.reduce((sum, a) => sum + a.distanceMeters, 0);
  const totalTime = activities.reduce((sum, a) => sum + a.totalTimeSeconds, 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);
  
  // Calculer le dénivelé total
  let totalElevationGain = 0;
  activities.forEach(activity => {
    const stats = calculateStatistics(activity);
    totalElevationGain += stats.elevationGain || 0;
  });
  
  // Calculer les moyennes de FC et cadence
  let totalHR = 0;
  let hrCount = 0;
  let totalCadence = 0;
  let cadenceCount = 0;
  
  activities.forEach(activity => {
    const stats = calculateStatistics(activity);
    if (stats.averageHeartRate) {
      totalHR += stats.averageHeartRate;
      hrCount++;
    }
    if (stats.averageCadence) {
      totalCadence += stats.averageCadence;
      cadenceCount++;
    }
  });
  
  // Répartition par sport
  const sportBreakdown: Record<string, { count: number; distance: number; time: number }> = {};
  activities.forEach(activity => {
    if (!sportBreakdown[activity.sport]) {
      sportBreakdown[activity.sport] = { count: 0, distance: 0, time: 0 };
    }
    sportBreakdown[activity.sport].count++;
    sportBreakdown[activity.sport].distance += activity.distanceMeters;
    sportBreakdown[activity.sport].time += activity.totalTimeSeconds;
  });
  
  return {
    period,
    dateRange,
    totalActivities: activities.length,
    totalDistance,
    totalTime,
    totalCalories,
    totalElevationGain,
    averageSpeed: totalTime > 0 ? totalDistance / totalTime : 0,
    averageHeartRate: hrCount > 0 ? totalHR / hrCount : undefined,
    averageCadence: cadenceCount > 0 ? totalCadence / cadenceCount : undefined,
    sportBreakdown,
  };
}

/**
 * Compare deux périodes
 */
export function comparePeriods(
  activities: Activity[],
  period: PeriodType,
  currentDate: Date = new Date()
): ComparisonData {
  const current = calculatePeriodStats(activities, period, currentDate);
  const previousDate = getPreviousPeriodBounds(period, currentDate).start;
  const previous = calculatePeriodStats(activities, period, previousDate);
  
  const changes = {
    distance: calculatePercentageChange(previous.totalDistance, current.totalDistance),
    time: calculatePercentageChange(previous.totalTime, current.totalTime),
    activities: calculatePercentageChange(previous.totalActivities, current.totalActivities),
    speed: calculatePercentageChange(previous.averageSpeed, current.averageSpeed),
  };
  
  return { current, previous, changes };
}

/**
 * Calcule le pourcentage de changement
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Génère les données d'évolution pour une métrique
 */
export function getEvolutionData(
  activities: Activity[],
  metric: 'distance' | 'time' | 'speed' | 'heartRate' | 'activities',
  period: PeriodType = 'week',
  numberOfPeriods: number = 12
): EvolutionMetric {
  const data: TrendData[] = [];
  const currentDate = new Date();
  
  // Générer les données pour chaque période
  for (let i = numberOfPeriods - 1; i >= 0; i--) {
    const periodDate = new Date(currentDate);
    
    switch (period) {
      case 'week':
        periodDate.setDate(periodDate.getDate() - (i * 7));
        break;
      case 'month':
        periodDate.setMonth(periodDate.getMonth() - i);
        break;
      case 'year':
        periodDate.setFullYear(periodDate.getFullYear() - i);
        break;
    }
    
    const stats = calculatePeriodStats(activities, period, periodDate);
    let value: number;
    
    switch (metric) {
      case 'distance':
        value = stats.totalDistance / 1000; // Convertir en km
        break;
      case 'time':
        value = stats.totalTime / 3600; // Convertir en heures
        break;
      case 'speed':
        value = stats.averageSpeed * 3.6; // Convertir en km/h
        break;
      case 'heartRate':
        value = stats.averageHeartRate || 0;
        break;
      case 'activities':
        value = stats.totalActivities;
        break;
    }
    
    data.push({
      date: stats.dateRange.start,
      value,
      label: formatPeriodLabel(stats.dateRange.start, period),
    });
  }
  
  // Calculer la tendance
  const trend = calculateTrend(data);
  
  return {
    type: metric,
    label: getMetricLabel(metric),
    unit: getMetricUnit(metric),
    data,
    trend: trend.direction,
    trendPercentage: trend.percentage,
  };
}

/**
 * Calcule la tendance des données
 */
function calculateTrend(data: TrendData[]): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  if (data.length < 2) return { direction: 'stable', percentage: 0 };
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (Math.abs(change) < 5) {
    return { direction: 'stable', percentage: change };
  }
  
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
}

/**
 * Formate le label d'une période
 */
function formatPeriodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case 'week':
      return `S${getWeek(date, { weekStartsOn: 1 })}`;
    case 'month':
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      return months[date.getMonth()];
    case 'year':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString('fr-FR');
  }
}

/**
 * Obtient le label d'une métrique
 */
function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    distance: 'Distance',
    time: 'Temps',
    speed: 'Vitesse',
    heartRate: 'Fréquence cardiaque',
    activities: 'Activités',
  };
  return labels[metric] || metric;
}

/**
 * Obtient l'unité d'une métrique
 */
function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    distance: 'km',
    time: 'h',
    speed: 'km/h',
    heartRate: 'bpm',
    activities: '',
  };
  return units[metric] || '';
}

/**
 * Génère les données de répartition hebdomadaire
 */
export function getWeeklyBreakdown(activities: Activity[], year: number): WeeklyBreakdown[] {
  const grouped = groupActivitiesByWeek(activities);
  const breakdowns: WeeklyBreakdown[] = [];
  
  grouped.forEach((weekActivities, key) => {
    const [yearStr, weekStr] = key.split('-W');
    const weekYear = parseInt(yearStr);
    const weekNumber = parseInt(weekStr);
    
    if (weekYear === year) {
      const firstActivity = weekActivities[0];
      const dateRange = getWeekBounds(new Date(firstActivity.startTime));
      
      breakdowns.push({
        weekNumber,
        year: weekYear,
        startDate: dateRange.start,
        endDate: dateRange.end,
        statistics: aggregateActivities(weekActivities, 'week', dateRange),
      });
    }
  });
  
  return breakdowns.sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * Génère les données de répartition mensuelle
 */
export function getMonthlyBreakdown(activities: Activity[], year: number): MonthlyBreakdown[] {
  const grouped = groupActivitiesByMonth(activities);
  const breakdowns: MonthlyBreakdown[] = [];
  
  grouped.forEach((monthActivities, key) => {
    const [yearStr, monthStr] = key.split('-');
    const monthYear = parseInt(yearStr);
    const month = parseInt(monthStr);
    
    if (monthYear === year) {
      const firstActivity = monthActivities[0];
      const dateRange = getMonthBounds(new Date(firstActivity.startTime));
      
      breakdowns.push({
        month,
        year: monthYear,
        statistics: aggregateActivities(monthActivities, 'month', dateRange),
      });
    }
  });
  
  return breakdowns.sort((a, b) => a.month - b.month);
}

/**
 * Génère les données de répartition annuelle
 */
export function getYearlyBreakdown(activities: Activity[]): YearlyBreakdown[] {
  const grouped = groupActivitiesByYear(activities);
  const breakdowns: YearlyBreakdown[] = [];
  
  grouped.forEach((yearActivities, yearStr) => {
    const year = parseInt(yearStr);
    const dateRange = getYearBounds(new Date(year, 0, 1));
    
    breakdowns.push({
      year,
      statistics: aggregateActivities(yearActivities, 'year', dateRange),
      monthlyData: getMonthlyBreakdown(yearActivities, year),
    });
  });
  
  return breakdowns.sort((a, b) => b.year - a.year);
}

/**
 * Génère les données de heatmap d'activité
 */
export function getActivityHeatmap(activities: Activity[], dateRange: DateRange): ActivityHeatmap[] {
  const grouped = groupActivitiesByDay(activities);
  const heatmap: ActivityHeatmap[] = [];
  
  grouped.forEach((dayActivities, dateStr) => {
    const date = new Date(dateStr);
    
    if (date >= dateRange.start && date <= dateRange.end) {
      const totalDistance = dayActivities.reduce((sum, a) => sum + a.distanceMeters, 0);
      const maxDistance = Math.max(...Array.from(grouped.values()).map(acts => 
        acts.reduce((sum, a) => sum + a.distanceMeters, 0)
      ));
      
      heatmap.push({
        date,
        count: dayActivities.length,
        distance: totalDistance,
        intensity: maxDistance > 0 ? totalDistance / maxDistance : 0,
      });
    }
  });
  
  return heatmap.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Made with Bob