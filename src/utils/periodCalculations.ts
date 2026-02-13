// Utilitaires pour les calculs de périodes

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, getWeek, getYear } from 'date-fns';
import type { PeriodType, DateRange } from '../types/statistics';
import type { Activity } from '../types/activity';

/**
 * Obtient les bornes d'une semaine
 */
export function getWeekBounds(date: Date): DateRange {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Lundi
    end: endOfWeek(date, { weekStartsOn: 1 }), // Dimanche
  };
}

/**
 * Obtient les bornes d'un mois
 */
export function getMonthBounds(date: Date): DateRange {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Obtient les bornes d'une année
 */
export function getYearBounds(date: Date): DateRange {
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
}

/**
 * Obtient les bornes de la période précédente
 */
export function getPreviousPeriodBounds(period: PeriodType, currentDate: Date): DateRange {
  switch (period) {
    case 'week':
      const prevWeekDate = subWeeks(currentDate, 1);
      return getWeekBounds(prevWeekDate);
    
    case 'month':
      const prevMonthDate = subMonths(currentDate, 1);
      return getMonthBounds(prevMonthDate);
    
    case 'year':
      const prevYearDate = subYears(currentDate, 1);
      return getYearBounds(prevYearDate);
    
    default:
      return getWeekBounds(subWeeks(currentDate, 1));
  }
}

/**
 * Obtient les bornes de la période suivante
 */
export function getNextPeriodBounds(period: PeriodType, currentDate: Date): DateRange {
  switch (period) {
    case 'week':
      const nextWeekDate = new Date(currentDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      return getWeekBounds(nextWeekDate);
    
    case 'month':
      const nextMonthDate = new Date(currentDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      return getMonthBounds(nextMonthDate);
    
    case 'year':
      const nextYearDate = new Date(currentDate);
      nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
      return getYearBounds(nextYearDate);
    
    default:
      const defaultNextDate = new Date(currentDate);
      defaultNextDate.setDate(defaultNextDate.getDate() + 7);
      return getWeekBounds(defaultNextDate);
  }
}

/**
 * Filtre les activités dans une plage de dates
 */
export function filterActivitiesByDateRange(
  activities: Activity[],
  dateRange: DateRange
): Activity[] {
  return activities.filter(activity => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= dateRange.start && activityDate <= dateRange.end;
  });
}

/**
 * Groupe les activités par semaine
 */
export function groupActivitiesByWeek(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.startTime);
    const weekNumber = getWeek(date, { weekStartsOn: 1 });
    const year = getYear(date);
    const key = `${year}-W${weekNumber}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return grouped;
}

/**
 * Groupe les activités par mois
 */
export function groupActivitiesByMonth(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.startTime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return grouped;
}

/**
 * Groupe les activités par année
 */
export function groupActivitiesByYear(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.startTime);
    const key = String(date.getFullYear());
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return grouped;
}

/**
 * Groupe les activités par jour
 */
export function groupActivitiesByDay(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.startTime);
    const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(activity);
  });
  
  return grouped;
}

/**
 * Calcule la moyenne hebdomadaire sur une période
 */
export function calculateWeeklyAverage(
  activities: Activity[],
  metric: 'distance' | 'time' | 'activities'
): number {
  if (activities.length === 0) return 0;
  
  const grouped = groupActivitiesByWeek(activities);
  const weeks = Array.from(grouped.values());
  
  if (weeks.length === 0) return 0;
  
  const total = weeks.reduce((sum, weekActivities) => {
    switch (metric) {
      case 'distance':
        return sum + weekActivities.reduce((s, a) => s + a.distanceMeters, 0);
      case 'time':
        return sum + weekActivities.reduce((s, a) => s + a.totalTimeSeconds, 0);
      case 'activities':
        return sum + weekActivities.length;
      default:
        return sum;
    }
  }, 0);
  
  return total / weeks.length;
}

/**
 * Calcule la moyenne mensuelle sur une période
 */
export function calculateMonthlyAverage(
  activities: Activity[],
  metric: 'distance' | 'time' | 'activities'
): number {
  if (activities.length === 0) return 0;
  
  const grouped = groupActivitiesByMonth(activities);
  const months = Array.from(grouped.values());
  
  if (months.length === 0) return 0;
  
  const total = months.reduce((sum, monthActivities) => {
    switch (metric) {
      case 'distance':
        return sum + monthActivities.reduce((s, a) => s + a.distanceMeters, 0);
      case 'time':
        return sum + monthActivities.reduce((s, a) => s + a.totalTimeSeconds, 0);
      case 'activities':
        return sum + monthActivities.length;
      default:
        return sum;
    }
  }, 0);
  
  return total / months.length;
}

/**
 * Vérifie si une date est dans une plage
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/**
 * Obtient le nombre de jours dans une plage
 */
export function getDaysInRange(range: DateRange): number {
  const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Génère un tableau de dates pour une plage
 */
export function generateDateArray(range: DateRange): Date[] {
  const dates: Date[] = [];
  const current = new Date(range.start);
  
  while (current <= range.end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Made with Bob