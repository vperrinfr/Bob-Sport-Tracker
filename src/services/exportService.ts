import type { Activity } from '../types/activity';
import { calculateStatistics, formatDistance, formatDuration, formatSpeed } from '../utils/statistics';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Service d'export des activités
 */
export class ExportService {
  /**
   * Exporte une activité en CSV
   */
  static exportToCSV(activity: Activity): string {
    const stats = calculateStatistics(activity);
    const lines: string[] = [];

    // En-tête des informations générales
    lines.push('# Informations générales');
    lines.push('Champ,Valeur');
    lines.push(`Sport,${activity.sport}`);
    lines.push(`Date,${format(new Date(activity.startTime), 'dd/MM/yyyy HH:mm:ss')}`);
    lines.push(`Distance,${formatDistance(stats.totalDistance)}`);
    lines.push(`Durée,${formatDuration(stats.totalTime)}`);
    lines.push(`Vitesse moyenne,${formatSpeed(stats.averageSpeed)}`);
    lines.push(`Vitesse max,${formatSpeed(stats.maxSpeed)}`);
    
    if (stats.averageHeartRate) {
      lines.push(`FC moyenne,${Math.round(stats.averageHeartRate)} bpm`);
    }
    if (stats.maxHeartRate) {
      lines.push(`FC max,${Math.round(stats.maxHeartRate)} bpm`);
    }
    if (stats.elevationGain) {
      lines.push(`Dénivelé positif,${Math.round(stats.elevationGain)} m`);
    }
    if (stats.totalCalories) {
      lines.push(`Calories,${stats.totalCalories} kcal`);
    }

    lines.push('');
    lines.push('# Points de trace');
    lines.push('Temps,Latitude,Longitude,Altitude (m),Distance (m),Vitesse (km/h),FC (bpm),Cadence (rpm)');

    // Données des trackpoints
    activity.laps.forEach((lap) => {
      lap.trackpoints.forEach((tp) => {
        const row = [
          format(new Date(tp.time), 'dd/MM/yyyy HH:mm:ss'),
          tp.latitude?.toFixed(6) || '',
          tp.longitude?.toFixed(6) || '',
          tp.altitude?.toFixed(1) || '',
          tp.distance?.toFixed(1) || '',
          tp.speed ? (tp.speed * 3.6).toFixed(2) : '',
          tp.heartRate || '',
          tp.cadence || '',
        ];
        lines.push(row.join(','));
      });
    });

    return lines.join('\n');
  }

  /**
   * Exporte une activité en JSON
   */
  static exportToJSON(activity: Activity): string {
    return JSON.stringify(activity, null, 2);
  }

  /**
   * Exporte plusieurs activités en JSON
   */
  static exportMultipleToJSON(activities: Activity[]): string {
    return JSON.stringify(activities, null, 2);
  }

  /**
   * Télécharge un fichier
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporte et télécharge une activité en CSV
   */
  static downloadActivityAsCSV(activity: Activity): void {
    const csv = this.exportToCSV(activity);
    const filename = `activity_${activity.sport}_${format(new Date(activity.startTime), 'yyyy-MM-dd_HH-mm')}.csv`;
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Exporte et télécharge une activité en JSON
   */
  static downloadActivityAsJSON(activity: Activity): void {
    const json = this.exportToJSON(activity);
    const filename = `activity_${activity.sport}_${format(new Date(activity.startTime), 'yyyy-MM-dd_HH-mm')}.json`;
    this.downloadFile(json, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Exporte et télécharge plusieurs activités en JSON
   */
  static downloadActivitiesAsJSON(activities: Activity[]): void {
    const json = this.exportMultipleToJSON(activities);
    const filename = `activities_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    this.downloadFile(json, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Génère un résumé textuel d'une activité
   */
  static generateSummary(activity: Activity): string {
    const stats = calculateStatistics(activity);
    const lines: string[] = [];

    lines.push(`=== ${activity.sport} ===`);
    lines.push(`Date: ${format(new Date(activity.startTime), 'PPP à HH:mm', { locale: fr })}`);
    lines.push('');
    lines.push('Statistiques:');
    lines.push(`- Distance: ${formatDistance(stats.totalDistance)}`);
    lines.push(`- Durée: ${formatDuration(stats.totalTime)}`);
    lines.push(`- Vitesse moyenne: ${formatSpeed(stats.averageSpeed)}`);
    lines.push(`- Vitesse max: ${formatSpeed(stats.maxSpeed)}`);

    if (stats.averageHeartRate) {
      lines.push(`- FC moyenne: ${Math.round(stats.averageHeartRate)} bpm`);
    }
    if (stats.maxHeartRate) {
      lines.push(`- FC max: ${Math.round(stats.maxHeartRate)} bpm`);
    }
    if (stats.elevationGain) {
      lines.push(`- Dénivelé positif: ${Math.round(stats.elevationGain)} m`);
    }
    if (stats.elevationLoss) {
      lines.push(`- Dénivelé négatif: ${Math.round(stats.elevationLoss)} m`);
    }
    if (stats.totalCalories) {
      lines.push(`- Calories: ${stats.totalCalories} kcal`);
    }

    if (activity.notes) {
      lines.push('');
      lines.push('Notes:');
      lines.push(activity.notes);
    }

    return lines.join('\n');
  }

  /**
   * Copie le résumé dans le presse-papiers
   */
  static async copySummaryToClipboard(activity: Activity): Promise<void> {
    const summary = this.generateSummary(activity);
    await navigator.clipboard.writeText(summary);
  }
}

// Made with Bob