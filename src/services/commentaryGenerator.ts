import type { Activity } from '../types/activity';
import type {
  CommentaryStyle,
  CommentaryGenerationParams,
  CommentaryResult,
  FormattedActivityData,
  SystemPrompt,
  GenerationOptions,
} from '../types/commentary';
import { ollamaService } from './ollamaService';
import {
  formatActivityForCommentary,
  generateActivitySummary,
  generateKeyMomentsDescription,
  extractHighlights,
} from './activityFormatter';
import { CommentaryStyle as CommentaryStyleEnum } from '../types/commentary';

/**
 * Service de génération de commentaires sportifs avec IBM Granite 3.3:2b
 * Utilise des stratégies de prompts optimisées pour différents styles
 */

/**
 * Prompts système pour chaque style de commentaire
 */
const SYSTEM_PROMPTS: Record<CommentaryStyle, SystemPrompt> = {
  [CommentaryStyleEnum.ENTHUSIASTIC]: {
    style: CommentaryStyleEnum.ENTHUSIASTIC,
    text: `Tu es un coach sportif enthousiaste et motivant, passionné par la performance de tes athlètes.`,
    instructions: [
      'Utilise un ton énergique et positif',
      'Célèbre chaque accomplissement',
      'Mets en valeur les points forts',
      'Encourage pour les prochains défis',
      'Utilise des émojis sportifs (🏃‍♂️, 💪, 🔥, ⚡, 🎯, 👏)',
      'Reste concis et impactant',
      'Termine sur une note motivante',
    ],
    examples: [
      'Quelle performance ! 🔥 Tu as maintenu une allure impressionnante sur ces 10km. Ton pic de vitesse au km 3 montre que tu as encore de la marge ! Continue comme ça, champion ! 💪',
      'Bravo pour cette sortie ! 👏 Malgré le dénivelé, tu as gardé un rythme constant. Ta fréquence cardiaque montre un excellent contrôle. Prêt pour le prochain défi ? ⚡',
    ],
  },
  [CommentaryStyleEnum.TECHNICAL]: {
    style: CommentaryStyleEnum.TECHNICAL,
    text: `Tu es un analyste sportif professionnel spécialisé dans l'analyse de performance.`,
    instructions: [
      'Concentre-toi sur les métriques et données',
      'Analyse les zones de fréquence cardiaque',
      'Évalue l\'efficacité de l\'allure',
      'Identifie les points d\'amélioration',
      'Utilise un vocabulaire technique précis',
      'Fournis des insights basés sur les données',
      'Reste objectif et factuel',
    ],
    examples: [
      'Analyse de performance : Allure moyenne de 5:00 min/km avec une FC moyenne de 155 bpm (zone 3). Le pic de vitesse au km 3 (4:35 min/km) indique une bonne capacité anaérobie. Le dénivelé de 120m a été géré avec une variation de FC de ±10 bpm, montrant une bonne adaptation cardiovasculaire.',
      'Performance solide sur 10.5km. La distribution de l\'effort est homogène avec une dérive cardiaque minimale (<5%). L\'allure constante suggère une bonne gestion de l\'effort. Point d\'amélioration : travailler la vitesse de base pour réduire l\'allure moyenne.',
    ],
  },
  [CommentaryStyleEnum.NARRATIVE]: {
    style: CommentaryStyleEnum.NARRATIVE,
    text: `Tu es un conteur sportif qui transforme chaque activité en une histoire captivante.`,
    instructions: [
      'Raconte l\'histoire de l\'activité',
      'Décris le parcours et les défis',
      'Crée une narration engageante',
      'Utilise des métaphores sportives',
      'Évoque les sensations et émotions',
      'Structure en début, milieu, fin',
      'Rends l\'expérience vivante',
    ],
    examples: [
      'Le départ est donné sous un ciel clément. Les premiers kilomètres s\'enchaînent avec fluidité, le rythme s\'installe naturellement. Au km 3, une accélération surprenante - le corps répond présent, les jambes trouvent leur cadence optimale. La montée du km 7 teste la détermination, mais la fréquence cardiaque reste maîtrisée. L\'arrivée se profile, 10.5km parcourus avec la satisfaction du devoir accompli.',
      'Cette sortie raconte l\'histoire d\'une progression maîtrisée. Chaque foulée construit sur la précédente, le dénivelé devient un allié plutôt qu\'un obstacle. Les 52 minutes s\'écoulent comme une méditation en mouvement, où le corps et l\'esprit ne font qu\'un.',
    ],
  },
};

/**
 * Construit le prompt complet pour la génération
 */
function buildPrompt(
  data: FormattedActivityData,
  params: CommentaryGenerationParams
): string {
  const systemPrompt = SYSTEM_PROMPTS[params.style];
  const summary = generateActivitySummary(data);
  const keyMoments = generateKeyMomentsDescription(data.keyMoments);
  const highlights = extractHighlights(data);

  // Déterminer la longueur cible
  const lengthInstructions = {
    short: 'Maximum 2-3 phrases courtes (environ 50 mots)',
    medium: 'Un paragraphe de 4-5 phrases (environ 100 mots)',
    long: 'Deux paragraphes détaillés (environ 150-200 mots)',
  };

  const prompt = `${systemPrompt.text}

INSTRUCTIONS:
${systemPrompt.instructions.map(i => `- ${i}`).join('\n')}
- Longueur: ${lengthInstructions[params.length]}
- Langue: ${params.language === 'fr' ? 'Français' : params.language}
${params.includeEmojis ? '- Inclure des émojis pertinents' : '- Ne pas utiliser d\'émojis'}

DONNÉES DE L'ACTIVITÉ:
${summary}

DÉTAILS:
- Sport: ${data.sport}
- Distance: ${data.distance} km
- Durée: ${data.duration}
${data.averagePace ? `- Allure moyenne: ${data.averagePace}` : ''}
- Vitesse moyenne: ${data.averageSpeed} km/h
- Vitesse maximale: ${data.maxSpeed} km/h
${data.averageHeartRate ? `- Fréquence cardiaque moyenne: ${data.averageHeartRate} bpm` : ''}
${data.maxHeartRate ? `- Fréquence cardiaque maximale: ${data.maxHeartRate} bpm` : ''}
${data.elevationGain ? `- Dénivelé positif: ${data.elevationGain} m` : ''}
${data.calories ? `- Calories: ${data.calories} kcal` : ''}

${keyMoments ? `MOMENTS CLÉS:\n${keyMoments}` : ''}

${highlights.length > 0 ? `POINTS FORTS:\n${highlights.map(h => `- ${h}`).join('\n')}` : ''}

Génère maintenant un commentaire ${params.style} en ${params.language} qui respecte toutes les instructions ci-dessus.`;

  return prompt;
}

/**
 * Génère un commentaire pour une activité
 */
export async function generateCommentary(
  activity: Activity,
  params: Partial<CommentaryGenerationParams> = {}
): Promise<CommentaryResult> {
  const startTime = Date.now();

  // Paramètres par défaut
  const generationParams: CommentaryGenerationParams = {
    style: params.style || CommentaryStyleEnum.ENTHUSIASTIC,
    length: params.length || 'medium',
    includeEmojis: params.includeEmojis !== undefined ? params.includeEmojis : true,
    language: params.language || 'fr',
  };

  // Formater les données de l'activité
  const formattedData = formatActivityForCommentary(activity);

  // Construire le prompt
  const prompt = buildPrompt(formattedData, generationParams);

  // Options de génération adaptées à la longueur
  const generationOptions: Partial<GenerationOptions> = {
    num_predict: generationParams.length === 'short' ? 100 : generationParams.length === 'medium' ? 150 : 250,
    temperature: generationParams.style === CommentaryStyleEnum.TECHNICAL ? 0.5 : 0.7,
  };

  try {
    // Générer le commentaire
    const response = await ollamaService.generate(prompt, generationOptions);

    const endTime = Date.now();

    return {
      text: response.response.trim(),
      style: generationParams.style,
      generatedAt: new Date(),
      generationTime: endTime - startTime,
      model: response.model,
      tokensGenerated: response.eval_count,
    };
  } catch (error) {
    console.error('Erreur lors de la génération du commentaire:', error);
    throw error;
  }
}

/**
 * Génère un commentaire avec streaming
 */
export async function generateCommentaryWithStreaming(
  activity: Activity,
  params: Partial<CommentaryGenerationParams> = {},
  onChunk: (chunk: string) => void
): Promise<CommentaryResult> {
  const startTime = Date.now();

  // Paramètres par défaut
  const generationParams: CommentaryGenerationParams = {
    style: params.style || CommentaryStyleEnum.ENTHUSIASTIC,
    length: params.length || 'medium',
    includeEmojis: params.includeEmojis !== undefined ? params.includeEmojis : true,
    language: params.language || 'fr',
  };

  // Formater les données de l'activité
  const formattedData = formatActivityForCommentary(activity);

  // Construire le prompt
  const prompt = buildPrompt(formattedData, generationParams);

  // Options de génération
  const generationOptions: Partial<GenerationOptions> = {
    num_predict: generationParams.length === 'short' ? 100 : generationParams.length === 'medium' ? 150 : 250,
    temperature: generationParams.style === CommentaryStyleEnum.TECHNICAL ? 0.5 : 0.7,
  };

  try {
    // Générer avec streaming
    const response = await ollamaService.generateWithStreaming(
      prompt,
      generationOptions,
      onChunk
    );

    const endTime = Date.now();

    return {
      text: response.response.trim(),
      style: generationParams.style,
      generatedAt: new Date(),
      generationTime: endTime - startTime,
      model: response.model,
      tokensGenerated: response.eval_count,
    };
  } catch (error) {
    console.error('Erreur lors de la génération du commentaire avec streaming:', error);
    throw error;
  }
}

/**
 * Génère un commentaire pour un moment clé spécifique
 */
export async function generateKeyMomentCommentary(
  activity: Activity,
  momentIndex: number,
  style: CommentaryStyle = CommentaryStyleEnum.ENTHUSIASTIC
): Promise<string> {
  const formattedData = formatActivityForCommentary(activity);
  const moment = formattedData.keyMoments[momentIndex];

  if (!moment) {
    throw new Error('Moment clé non trouvé');
  }

  const systemPrompt = SYSTEM_PROMPTS[style];

  const prompt = `${systemPrompt.text}

Tu commentes en direct un moment clé d'une activité sportive.

CONTEXTE DE L'ACTIVITÉ:
- Sport: ${formattedData.sport}
- Distance totale: ${formattedData.distance} km
- Allure moyenne: ${formattedData.averagePace || 'N/A'}

MOMENT CLÉ À COMMENTER:
- Type: ${moment.type}
- Timestamp: ${moment.timestamp}s depuis le début
- Description: ${moment.description}
${moment.value ? `- Valeur: ${moment.value} ${moment.unit}` : ''}

INSTRUCTIONS:
- Génère un commentaire court et percutant (1-2 phrases maximum)
- Utilise un ton ${style}
- Inclure un émoji pertinent
- Reste dans le moment présent

Commentaire:`;

  try {
    const response = await ollamaService.generate(prompt, {
      num_predict: 50,
      temperature: 0.8,
    });

    return response.response.trim();
  } catch (error) {
    console.error('Erreur lors de la génération du commentaire de moment clé:', error);
    throw error;
  }
}

/**
 * Génère plusieurs variations d'un commentaire
 */
export async function generateCommentaryVariations(
  activity: Activity,
  count: number = 3,
  params: Partial<CommentaryGenerationParams> = {}
): Promise<CommentaryResult[]> {
  const variations: CommentaryResult[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const result = await generateCommentary(activity, {
        ...params,
        // Augmenter légèrement la température pour plus de variation
      });
      variations.push(result);
    } catch (error) {
      console.error(`Erreur lors de la génération de la variation ${i + 1}:`, error);
    }
  }

  return variations;
}

/**
 * Valide et nettoie un commentaire généré
 */
export function validateAndCleanCommentary(text: string): string {
  let cleaned = text.trim();

  // Supprimer les préfixes courants du modèle
  const prefixesToRemove = [
    'Commentaire:',
    'Voici le commentaire:',
    'Génération:',
    'Résultat:',
  ];

  for (const prefix of prefixesToRemove) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  // Supprimer les guillemets au début et à la fin
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // Assurer qu'il y a un point final
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Estime le temps de génération basé sur les paramètres
 */
export function estimateGenerationTime(params: CommentaryGenerationParams): number {
  // Estimation basée sur la longueur et le modèle
  const baseTime = 5000; // 5 secondes de base
  const lengthMultiplier = {
    short: 1,
    medium: 1.5,
    long: 2.5,
  };

  return baseTime * lengthMultiplier[params.length];
}

/**
 * Récupère les exemples de commentaires pour un style donné
 */
export function getExamplesForStyle(style: CommentaryStyle): string[] {
  return SYSTEM_PROMPTS[style].examples || [];
}

/**
 * Récupère la description d'un style
 */
export function getStyleDescription(style: CommentaryStyle): string {
  const descriptions = {
    [CommentaryStyleEnum.ENTHUSIASTIC]: 'Style enthousiaste et motivant, comme un coach sportif qui célèbre vos performances',
    [CommentaryStyleEnum.TECHNICAL]: 'Style technique et analytique, focalisé sur les métriques et l\'analyse de performance',
    [CommentaryStyleEnum.NARRATIVE]: 'Style narratif et descriptif, qui raconte l\'histoire de votre activité',
  };

  return descriptions[style];
}

// Made with ❤️ by Bob

// Made with Bob
