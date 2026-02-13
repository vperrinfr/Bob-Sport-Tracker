# 🏃 Intégration Strava

Ce document explique comment configurer et utiliser l'intégration Strava dans Sport Activity Tracker.

## 📋 Prérequis

1. Un compte Strava
2. Une application Strava (gratuite)

## 🔧 Configuration

### Étape 1 : Créer une application Strava

1. Connectez-vous à [Strava](https://www.strava.com)
2. Allez sur [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
3. Cliquez sur "Create an App" ou "My API Application"
4. Remplissez le formulaire :
   - **Application Name** : Sport Activity Tracker (ou votre nom)
   - **Category** : Choisissez "Data Importer"
   - **Club** : Laissez vide
   - **Website** : `http://localhost:5173` (pour le développement)
   - **Authorization Callback Domain** : `localhost`
   - **Application Description** : Une brève description
5. Acceptez les conditions et créez l'application
6. Notez votre **Client ID** et **Client Secret**

### Étape 2 : Configurer l'application

1. Lancez l'application : `npm run dev`
2. Allez dans l'onglet **Strava** dans la navigation
3. Cliquez sur "Afficher" dans la section Configuration API
4. Entrez vos identifiants :
   - **Client ID** : Votre Client ID Strava
   - **Client Secret** : Votre Client Secret Strava
   - **Redirect URI** : Devrait être pré-rempli avec `http://localhost:5173/strava/callback`
5. Cliquez sur "Sauvegarder la configuration"

### Étape 3 : Se connecter à Strava

1. Cliquez sur "Se connecter avec Strava"
2. Vous serez redirigé vers Strava pour autoriser l'application
3. Acceptez les permissions demandées :
   - Lecture de vos activités
   - Lecture de toutes vos données d'activité
4. Vous serez redirigé vers l'application
5. La connexion est établie ! ✅

## 🔄 Synchronisation des activités

### Synchronisation manuelle

Une fois connecté, vous avez plusieurs options :

#### Synchroniser les activités récentes (30 jours)
- Cliquez sur "Synchroniser les activités récentes"
- Importe toutes les activités des 30 derniers jours
- Rapide et recommandé pour une utilisation régulière

#### Synchroniser toutes les activités
- Cliquez sur "Synchroniser toutes les activités"
- Importe TOUTES vos activités Strava
- ⚠️ Peut prendre du temps si vous avez beaucoup d'activités
- Affiche une barre de progression

### Détection des doublons

L'application détecte automatiquement les activités déjà importées :
- Les activités existantes sont ignorées
- Seules les nouvelles activités sont importées
- Chaque activité Strava a un ID unique : `strava-{id}`

### Indicateur de nouvelles activités

Un badge orange apparaît sur le bouton Strava quand de nouvelles activités sont disponibles :
- Vérifié automatiquement au chargement du Dashboard
- Affiche le nombre de nouvelles activités

## 📊 Données synchronisées

Pour chaque activité, l'application importe :

### Informations générales
- Type de sport (Course, Vélo, Natation, etc.)
- Date et heure de début
- Durée totale
- Distance
- Calories brûlées
- Description/Notes

### Données GPS
- Parcours complet (latitude/longitude)
- Altitude
- Carte interactive

### Métriques
- Vitesse (moyenne et maximale)
- Fréquence cardiaque (si disponible)
- Cadence (si disponible)
- Puissance (si disponible)

### Laps/Tours
- Statistiques par tour
- Temps et distance de chaque tour

## 🔐 Sécurité et confidentialité

### Stockage local
- Tous les tokens d'accès sont stockés localement dans votre navigateur
- Aucune donnée n'est envoyée à un serveur externe
- Les données restent sur votre appareil

### Tokens d'accès
- Les tokens sont automatiquement rafraîchis avant expiration
- Durée de validité : 6 heures
- Rafraîchissement automatique transparent

### Déconnexion
- Cliquez sur "Se déconnecter" pour révoquer l'accès
- Supprime tous les tokens locaux
- Révoque l'autorisation sur Strava

## 🛠️ Gestion des activités

### Supprimer les activités Strava

Pour supprimer toutes les activités importées depuis Strava :
1. Allez dans l'onglet Strava
2. Cliquez sur "Supprimer toutes les activités Strava"
3. Confirmez l'action
4. ⚠️ Cette action est irréversible

### Identifier les activités Strava

Les activités Strava sont identifiables par :
- ID commençant par `strava-`
- Badge "Strava" dans la liste des activités (à venir)

## 🔄 Synchronisation automatique

### Fonctionnalités futures
- Synchronisation automatique au démarrage
- Synchronisation périodique en arrière-plan
- Notifications de nouvelles activités

## ❓ Dépannage

### Erreur "Configuration manquante"
- Vérifiez que vous avez bien sauvegardé votre Client ID et Secret
- Rechargez la page

### Erreur "Autorisation refusée"
- Vous avez refusé l'autorisation sur Strava
- Réessayez en acceptant les permissions

### Erreur "Token expiré"
- Le token est automatiquement rafraîchi
- Si l'erreur persiste, déconnectez-vous et reconnectez-vous

### Activités manquantes
- Vérifiez que les activités sont publiques ou privées sur Strava
- Certaines activités peuvent être filtrées par Strava
- Essayez de synchroniser à nouveau

### Erreur de limite de taux (Rate Limit)
- Strava limite le nombre de requêtes API
- Attendez quelques minutes avant de réessayer
- L'application ajoute automatiquement des pauses entre les requêtes

## 📝 Limites de l'API Strava

### Limites de taux
- **15 minutes** : 100 requêtes
- **Quotidien** : 1000 requêtes
- L'application gère automatiquement ces limites

### Données disponibles
- Activités publiques et privées
- Historique complet
- Pas d'accès aux activités d'autres utilisateurs

## 🔗 Liens utiles

- [Documentation API Strava](https://developers.strava.com/docs/reference/)
- [Portail développeur Strava](https://www.strava.com/settings/api)
- [Conditions d'utilisation Strava](https://www.strava.com/legal/api)

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez les logs de la console du navigateur (F12)
3. Créez une issue sur GitHub

---

Made with ❤️ by Bob