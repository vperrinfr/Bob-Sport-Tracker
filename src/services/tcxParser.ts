import type { Activity, Lap, Trackpoint } from '../types/activity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse un fichier TCX et extrait les données d'activité
 */
export class TCXParser {
  /**
   * Parse le contenu XML d'un fichier TCX
   */
  static async parseFile(file: File): Promise<Activity> {
    const text = await file.text();
    return this.parseXML(text);
  }

  /**
   * Parse une chaîne XML TCX
   */
  static parseXML(xmlString: string): Activity {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Vérifier les erreurs de parsing
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Erreur de parsing XML: ' + parserError.textContent);
    }

    // Extraire l'activité
    const activityElement = xmlDoc.querySelector('Activity');
    if (!activityElement) {
      throw new Error('Aucune activité trouvée dans le fichier TCX');
    }

    const sport = activityElement.getAttribute('Sport') || 'Unknown';
    const id = xmlDoc.querySelector('Id')?.textContent || uuidv4();
    
    // Parser les laps
    const lapElements = activityElement.querySelectorAll('Lap');
    const laps: Lap[] = Array.from(lapElements).map(lapEl => this.parseLap(lapEl));

    if (laps.length === 0) {
      throw new Error('Aucun lap trouvé dans l\'activité');
    }

    // Calculer les statistiques globales
    const totalTimeSeconds = laps.reduce((sum, lap) => sum + lap.totalTimeSeconds, 0);
    const distanceMeters = laps.reduce((sum, lap) => sum + lap.distanceMeters, 0);
    const calories = laps.reduce((sum, lap) => sum + (lap.calories || 0), 0);

    // Extraire les informations du créateur
    const creatorElement = xmlDoc.querySelector('Creator');
    const creator = creatorElement ? {
      name: creatorElement.querySelector('Name')?.textContent || undefined,
      version: creatorElement.querySelector('Version')?.textContent || undefined,
      unitId: creatorElement.querySelector('UnitId')?.textContent || undefined,
      productId: creatorElement.querySelector('ProductID')?.textContent || undefined,
    } : undefined;

    // Extraire les notes
    const notes = xmlDoc.querySelector('Notes')?.textContent || undefined;

    const activity: Activity = {
      id,
      sport,
      startTime: laps[0].startTime,
      totalTimeSeconds,
      distanceMeters,
      calories: calories > 0 ? calories : undefined,
      notes,
      laps,
      creator,
    };

    return activity;
  }

  /**
   * Parse un élément Lap
   */
  private static parseLap(lapElement: Element): Lap {
    const startTime = new Date(lapElement.getAttribute('StartTime') || '');
    const totalTimeSeconds = parseFloat(lapElement.querySelector('TotalTimeSeconds')?.textContent || '0');
    const distanceMeters = parseFloat(lapElement.querySelector('DistanceMeters')?.textContent || '0');
    const maximumSpeed = this.parseOptionalFloat(lapElement.querySelector('MaximumSpeed')?.textContent);
    const calories = this.parseOptionalFloat(lapElement.querySelector('Calories')?.textContent);
    
    const avgHR = lapElement.querySelector('AverageHeartRateBpm Value');
    const maxHR = lapElement.querySelector('MaximumHeartRateBpm Value');
    const averageHeartRate = avgHR ? parseFloat(avgHR.textContent || '0') : undefined;
    const maximumHeartRate = maxHR ? parseFloat(maxHR.textContent || '0') : undefined;
    
    const intensity = lapElement.querySelector('Intensity')?.textContent as 'Active' | 'Resting' | undefined;
    const cadence = this.parseOptionalFloat(lapElement.querySelector('Cadence')?.textContent);
    const triggerMethod = lapElement.querySelector('TriggerMethod')?.textContent || undefined;

    // Parser les trackpoints
    const trackElement = lapElement.querySelector('Track');
    const trackpointElements = trackElement ? trackElement.querySelectorAll('Trackpoint') : [];
    const trackpoints: Trackpoint[] = Array.from(trackpointElements).map(tp => this.parseTrackpoint(tp));

    return {
      startTime,
      totalTimeSeconds,
      distanceMeters,
      maximumSpeed,
      calories,
      averageHeartRate,
      maximumHeartRate,
      intensity,
      cadence,
      triggerMethod,
      trackpoints,
    };
  }

  /**
   * Parse un élément Trackpoint
   */
  private static parseTrackpoint(trackpointElement: Element): Trackpoint {
    const time = new Date(trackpointElement.querySelector('Time')?.textContent || '');
    
    const position = trackpointElement.querySelector('Position');
    const latitude = position ? parseFloat(position.querySelector('LatitudeDegrees')?.textContent || '') : undefined;
    const longitude = position ? parseFloat(position.querySelector('LongitudeDegrees')?.textContent || '') : undefined;
    
    const altitude = this.parseOptionalFloat(trackpointElement.querySelector('AltitudeMeters')?.textContent);
    const distance = this.parseOptionalFloat(trackpointElement.querySelector('DistanceMeters')?.textContent);
    
    const hrElement = trackpointElement.querySelector('HeartRateBpm Value');
    const heartRate = hrElement ? parseFloat(hrElement.textContent || '0') : undefined;
    
    const cadence = this.parseOptionalFloat(trackpointElement.querySelector('Cadence')?.textContent);
    
    // Extensions pour vitesse et puissance
    const extensions = trackpointElement.querySelector('Extensions');
    let speed: number | undefined;
    let power: number | undefined;
    
    if (extensions) {
      const speedElement = extensions.querySelector('Speed, ns3\\:Speed');
      speed = speedElement ? parseFloat(speedElement.textContent || '') : undefined;
      
      const powerElement = extensions.querySelector('Watts, ns3\\:Watts');
      power = powerElement ? parseFloat(powerElement.textContent || '') : undefined;
    }

    return {
      time,
      latitude: !isNaN(latitude!) ? latitude : undefined,
      longitude: !isNaN(longitude!) ? longitude : undefined,
      altitude,
      distance,
      heartRate,
      cadence,
      speed,
      power,
    };
  }

  /**
   * Parse un nombre optionnel
   */
  private static parseOptionalFloat(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Valide qu'un fichier est bien un TCX
   */
  static async validateFile(file: File): Promise<boolean> {
    try {
      // Vérifier l'extension
      if (!file.name.toLowerCase().endsWith('.tcx')) {
        return false;
      }

      // Lire le début du fichier pour vérifier le contenu
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Vérifier qu'il n'y a pas d'erreur de parsing
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        return false;
      }

      // Vérifier la présence des éléments TCX essentiels
      const trainingCenterDatabase = xmlDoc.querySelector('TrainingCenterDatabase');
      const activity = xmlDoc.querySelector('Activity');

      return !!(trainingCenterDatabase && activity);
    } catch (error) {
      console.error('Erreur de validation:', error);
      return false;
    }
  }
}

// Made with Bob
