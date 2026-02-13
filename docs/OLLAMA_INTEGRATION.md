# 🤖 Intégration Ollama avec IBM Granite 3.3:2b

Guide complet pour installer et configurer la génération automatique de commentaires sportifs avec IBM Granite 3.3:2b via Ollama.

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Installation d'Ollama](#installation-dollama)
3. [Installation du modèle IBM Granite 3.3:2b](#installation-du-modèle-ibm-granite-332b)
4. [Configuration de l'application](#configuration-de-lapplication)
5. [Utilisation](#utilisation)
6. [Personnalisation des prompts](#personnalisation-des-prompts)
7. [Optimisation des performances](#optimisation-des-performances)
8. [Dépannage](#dépannage)
9. [FAQ](#faq)

---

## 🎯 Introduction

Cette intégration permet de générer automatiquement des commentaires motivants et enthousiastes pour vos activités sportives en utilisant le modèle IBM Granite 3.3:2b exécuté localement via Ollama.

### Fonctionnalités

✅ **Génération automatique** après import d'activité  
✅ **Commentaires en temps réel** pendant la visualisation  
✅ **Style coach sportif** motivant et enthousiaste  
✅ **Streaming en direct** pour une expérience fluide  
✅ **100% local** - vos données restent privées  
✅ **Personnalisable** - ajustez le style selon vos préférences  

### Prérequis

- **Système d'exploitation** : macOS, Linux, ou Windows
- **RAM** : Minimum 8 GB (16 GB recommandé)
- **Espace disque** : ~2 GB pour le modèle
- **Node.js** : Version 18 ou supérieure

---

## 🚀 Installation d'Ollama

### macOS

```bash
# Télécharger et installer Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Ou via Homebrew
brew install ollama
```

### Linux

```bash
# Installation via script officiel
curl -fsSL https://ollama.com/install.sh | sh

# Démarrer le service Ollama
sudo systemctl start ollama
sudo systemctl enable ollama
```

### Windows

1. Téléchargez l'installateur depuis [ollama.com/download](https://ollama.com/download)
2. Exécutez le fichier `.exe` et suivez les instructions
3. Ollama démarrera automatiquement en arrière-plan

### Vérification de l'installation

```bash
# Vérifier qu'Ollama est installé et en cours d'exécution
ollama --version

# Tester la connexion
curl http://localhost:11434/api/tags
```

Vous devriez voir une réponse JSON avec la liste des modèles installés (vide au début).

---

## 📦 Installation du modèle IBM Granite 3.3:2b

### Téléchargement du modèle

```bash
# Télécharger IBM Granite 3.3:2b (version dense optimisée)
ollama pull granite3.1-dense:2b
```

Le téléchargement prendra quelques minutes selon votre connexion internet (~1.5 GB).

### Vérification du modèle

```bash
# Lister les modèles installés
ollama list

# Tester le modèle
ollama run granite3.1-dense:2b "Bonjour, comment vas-tu ?"
```

### Modèles alternatifs

Si vous avez plus de RAM disponible, vous pouvez utiliser des versions plus grandes :

```bash
# Version 8B (nécessite ~8 GB RAM)
ollama pull granite3.1-dense:8b

# Version 3B (nécessite ~4 GB RAM)
ollama pull granite3.1-dense:3b
```

---

## ⚙️ Configuration de l'application

### 1. Installation des dépendances

```bash
cd sport-activity-tracker
npm install
```

Les dépendances nécessaires (`ollama`) sont déjà incluses dans le `package.json`.

### 2. Configuration initiale

Au premier lancement, l'application détectera automatiquement si Ollama est installé et configuré.

### 3. Accéder aux paramètres Ollama

1. Ouvrez l'application
2. Allez dans **Paramètres** → **Ollama**
3. Vérifiez la connexion avec le bouton **"Tester la connexion"**

### 4. Configuration avancée

Dans la page des paramètres Ollama, vous pouvez ajuster :

- **URL Ollama** : Par défaut `http://localhost:11434`
- **Modèle** : Sélectionnez `granite3.1-dense:2b`
- **Style de commentaire** : Enthousiaste (par défaut), Technique, Narratif
- **Génération automatique** : Activée/Désactivée
- **Streaming** : Activé pour affichage progressif
- **Température** : 0.7 (créativité modérée)
- **Longueur max** : 200 tokens (~150 mots)

---

## 🎮 Utilisation

### Génération automatique après import

1. **Importez une activité** (fichier TCX ou via Strava)
2. L'application génère automatiquement un commentaire
3. Le commentaire apparaît dans la section **"Commentaire du Coach"**

### Génération manuelle

Dans les détails d'une activité :

1. Cliquez sur **"Régénérer le commentaire"**
2. Le nouveau commentaire remplace l'ancien
3. Vous pouvez copier le commentaire dans le presse-papiers

### Commentaires en temps réel

Pendant la visualisation d'une activité :

1. Activez le mode **"Commentaire en direct"**
2. Cliquez sur **"Play"** pour démarrer
3. Le commentateur IA analyse les données en temps réel
4. Les moments clés sont automatiquement commentés :
   - 🏃‍♂️ Départ de la course
   - ⚡ Meilleur temps au kilomètre
   - 💪 Pic de fréquence cardiaque
   - 🏔️ Montées importantes
   - 🏁 Arrivée et résumé

### Contrôles du commentaire en direct

- **▶️ Play** : Démarre le commentaire
- **⏸️ Pause** : Met en pause
- **⏹️ Stop** : Arrête et réinitialise
- **⏩ Vitesse** : Ajuste la vitesse de lecture (0.5x, 1x, 2x, 4x)

---

## 🎨 Personnalisation des prompts

### Modifier le style de commentaire

Les prompts sont définis dans `src/services/commentaryGenerator.ts`. Vous pouvez personnaliser :

#### Style Enthousiaste (par défaut)

```typescript
const enthusiasticPrompt = `
Tu es un coach sportif enthousiaste et motivant.
Ton rôle est d'encourager et de célébrer les performances.
Utilise des émojis sportifs et un ton positif.
`;
```

#### Style Technique

```typescript
const technicalPrompt = `
Tu es un analyste sportif professionnel.
Concentre-toi sur les métriques, les zones de fréquence cardiaque,
et les aspects techniques de la performance.
`;
```

#### Style Narratif

```typescript
const narrativePrompt = `
Tu es un conteur sportif.
Raconte l'histoire de cette activité comme une aventure,
en décrivant le parcours, les défis, et les victoires.
`;
```

### Créer un style personnalisé

1. Ouvrez `src/services/commentaryGenerator.ts`
2. Ajoutez votre nouveau style dans l'enum `CommentaryStyle`
3. Créez le prompt correspondant
4. Ajoutez-le dans la fonction `getPromptForStyle()`

Exemple :

```typescript
export enum CommentaryStyle {
  ENTHUSIASTIC = 'enthusiastic',
  TECHNICAL = 'technical',
  NARRATIVE = 'narrative',
  HUMOROUS = 'humorous', // Nouveau style
}

const humorousPrompt = `
Tu es un commentateur sportif avec un sens de l'humour décalé.
Fais des blagues légères sur la performance tout en restant encourageant.
Utilise des références à la culture populaire.
`;
```

### Ajuster les paramètres du modèle

Dans `src/services/ollamaService.ts`, modifiez les paramètres :

```typescript
const options = {
  temperature: 0.7,      // 0.0 = déterministe, 1.0 = créatif
  top_p: 0.9,           // Diversité du vocabulaire
  top_k: 40,            // Limitation des choix de mots
  repeat_penalty: 1.1,  // Éviter les répétitions
  num_predict: 200,     // Longueur maximale
};
```

---

## ⚡ Optimisation des performances

### Réduire le temps de génération

1. **Utilisez un modèle plus petit** :
   ```bash
   ollama pull granite3.1-dense:2b  # Plus rapide
   ```

2. **Réduisez la longueur des commentaires** :
   ```typescript
   num_predict: 100  // Au lieu de 200
   ```

3. **Désactivez le streaming** si vous préférez attendre le résultat complet

### Optimiser l'utilisation de la RAM

1. **Limitez le contexte** :
   ```typescript
   num_ctx: 1024  // Au lieu de 2048
   ```

2. **Fermez les autres applications** gourmandes en mémoire

3. **Utilisez le modèle 2B** au lieu du 8B

### Améliorer la qualité des commentaires

1. **Augmentez la température** pour plus de créativité :
   ```typescript
   temperature: 0.8
   ```

2. **Fournissez plus de contexte** dans les prompts

3. **Utilisez un modèle plus grand** si vous avez la RAM :
   ```bash
   ollama pull granite3.1-dense:8b
   ```

### Gestion du cache

L'application met en cache les commentaires générés pour éviter les régénérations inutiles :

- Cache stocké dans IndexedDB
- Invalidation automatique si l'activité change
- Possibilité de forcer la régénération

---

## 🔧 Dépannage

### Problème : Ollama n'est pas détecté

**Symptômes** : Message "Ollama n'est pas installé ou ne répond pas"

**Solutions** :

1. Vérifiez qu'Ollama est installé :
   ```bash
   ollama --version
   ```

2. Vérifiez que le service est démarré :
   ```bash
   # macOS/Linux
   ps aux | grep ollama
   
   # Windows
   tasklist | findstr ollama
   ```

3. Redémarrez Ollama :
   ```bash
   # macOS/Linux
   killall ollama
   ollama serve
   
   # Windows
   # Redémarrez depuis le menu système
   ```

4. Vérifiez l'URL dans les paramètres (doit être `http://localhost:11434`)

### Problème : Le modèle n'est pas trouvé

**Symptômes** : Erreur "Model 'granite3.1-dense:2b' not found"

**Solutions** :

1. Vérifiez les modèles installés :
   ```bash
   ollama list
   ```

2. Installez le modèle :
   ```bash
   ollama pull granite3.1-dense:2b
   ```

3. Vérifiez le nom exact du modèle dans les paramètres

### Problème : Génération très lente

**Symptômes** : Le commentaire prend plus de 30 secondes à générer

**Solutions** :

1. **Vérifiez votre RAM disponible** :
   ```bash
   # macOS/Linux
   free -h
   
   # macOS spécifique
   vm_stat
   ```

2. **Utilisez un modèle plus petit** :
   ```bash
   ollama pull granite3.1-dense:2b
   ```

3. **Réduisez la longueur** dans les paramètres :
   ```typescript
   num_predict: 100
   ```

4. **Fermez les applications** non nécessaires

### Problème : Commentaires de mauvaise qualité

**Symptômes** : Commentaires génériques, répétitifs, ou hors sujet

**Solutions** :

1. **Augmentez la température** pour plus de variété :
   ```typescript
   temperature: 0.8
   ```

2. **Utilisez un modèle plus grand** :
   ```bash
   ollama pull granite3.1-dense:8b
   ```

3. **Améliorez les prompts** avec plus de contexte

4. **Régénérez** plusieurs fois pour obtenir un meilleur résultat

### Problème : Erreur de connexion réseau

**Symptômes** : "Failed to fetch" ou "Network error"

**Solutions** :

1. Vérifiez que le port 11434 n'est pas bloqué :
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Désactivez temporairement le pare-feu

3. Vérifiez les paramètres proxy si vous en utilisez un

### Problème : L'application se bloque pendant la génération

**Symptômes** : Interface non réactive pendant la génération

**Solutions** :

1. **Activez le streaming** dans les paramètres
2. **Réduisez le timeout** :
   ```typescript
   timeout: 30000  // 30 secondes
   ```
3. Vérifiez la console du navigateur pour les erreurs

---

## ❓ FAQ

### Mes données sont-elles envoyées à un serveur externe ?

**Non.** Tout fonctionne localement sur votre machine. Ollama et le modèle Granite s'exécutent sur votre ordinateur, et aucune donnée n'est envoyée sur internet.

### Puis-je utiliser un autre modèle que Granite ?

**Oui.** Vous pouvez utiliser n'importe quel modèle compatible avec Ollama :

```bash
# Exemples d'autres modèles
ollama pull llama3.2:3b
ollama pull mistral:7b
ollama pull phi3:mini
```

Modifiez ensuite le nom du modèle dans les paramètres de l'application.

### Quelle est la différence entre les versions 2B, 3B, et 8B ?

- **2B** : Plus rapide, moins de RAM (~2 GB), qualité correcte
- **3B** : Bon équilibre vitesse/qualité (~4 GB RAM)
- **8B** : Meilleure qualité, plus lent (~8 GB RAM)

### Puis-je utiliser l'application sans Ollama ?

**Oui.** L'application fonctionne normalement sans Ollama. La fonctionnalité de génération de commentaires sera simplement désactivée.

### Comment désactiver la génération automatique ?

Allez dans **Paramètres** → **Ollama** et désactivez l'option **"Génération automatique"**.

### Les commentaires sont-ils sauvegardés ?

**Oui.** Les commentaires générés sont sauvegardés dans IndexedDB avec l'activité correspondante.

### Puis-je modifier un commentaire généré ?

**Oui.** Cliquez sur le commentaire pour l'éditer manuellement. Vous pouvez aussi le régénérer complètement.

### Combien de temps prend la génération d'un commentaire ?

Cela dépend de votre matériel :
- **Modèle 2B** : 5-15 secondes
- **Modèle 8B** : 15-45 secondes

Avec le streaming activé, vous verrez le texte apparaître progressivement.

### Puis-je utiliser Ollama sur un serveur distant ?

**Oui.** Modifiez l'URL dans les paramètres :

```
http://votre-serveur:11434
```

Assurez-vous que le serveur est accessible depuis votre réseau.

### Le modèle fonctionne-t-il hors ligne ?

**Oui.** Une fois le modèle téléchargé, tout fonctionne hors ligne. Seul le téléchargement initial nécessite une connexion internet.

### Comment mettre à jour Ollama ?

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Ou via Homebrew
brew upgrade ollama

# Windows
# Téléchargez la dernière version depuis ollama.com
```

### Puis-je utiliser plusieurs modèles en même temps ?

**Oui.** Vous pouvez installer plusieurs modèles et changer dans les paramètres selon vos besoins.

### Comment supprimer un modèle ?

```bash
ollama rm granite3.1-dense:2b
```

### L'application supporte-t-elle d'autres langues ?

Le modèle Granite supporte plusieurs langues. Modifiez les prompts dans `commentaryGenerator.ts` pour générer des commentaires dans une autre langue.

---

## 📚 Ressources supplémentaires

### Documentation officielle

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/README.md)
- [IBM Granite Models](https://www.ibm.com/granite)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)

### Communauté

- [Ollama Discord](https://discord.gg/ollama)
- [GitHub Issues](https://github.com/ollama/ollama/issues)

### Tutoriels vidéo

- [Getting Started with Ollama](https://www.youtube.com/watch?v=...)
- [Optimizing Local LLMs](https://www.youtube.com/watch?v=...)

---

## 🤝 Support

Si vous rencontrez des problèmes non couverts par ce guide :

1. Consultez les [Issues GitHub](https://github.com/votre-repo/issues)
2. Vérifiez la [documentation Ollama](https://ollama.com/docs)
3. Créez une nouvelle issue avec :
   - Version d'Ollama (`ollama --version`)
   - Système d'exploitation
   - Logs d'erreur
   - Étapes pour reproduire le problème

---

**Made with ❤️ by Bob**

*Dernière mise à jour : Février 2026*