# PitiLink

Application de gestion, suivi et communication **Garderie ↔ Parents**, développée à partir
du cahier des charges fonctionnel v1.0 (voir résumé du périmètre plus bas).

Principe directeur : *« La garderie ne doit pas travailler pour l'application. L'application
doit travailler pour la garderie. »* — saisie minimale, gros boutons, préremplissage,
modèle **prévu → réel**.

## Stack technique

- **Next.js 16** (App Router, React 19, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma ORM 7** (driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials, sessions JWT, multi-tenant par garderie, rôles). Verrouillage
  temporaire du compte après 5 échecs de connexion consécutifs (15 minutes), stocké en base
  pour rester efficace en serverless (pas de mémoire partagée entre invocations).
- **TailwindCSS v4** — sidebar + onglets + tuiles colorées, mobile-first (gros boutons,
  pictogrammes)
- **Vercel Blob** (`@vercel/blob`) — upload des photos (profil enfant, souvenirs, documents)
- Server Actions (Next.js) pour toutes les mutations — pas d'API REST séparée
- **Vitest** (logique métier pure) + **Playwright** (parcours E2E critiques)

## Démarrage local

### 1. Base de données

```bash
# PostgreSQL doit tourner localement (ou adapter DATABASE_URL dans .env)
createdb pitilink
```

### 2. Variables d'environnement

Le fichier `.env` contient déjà des valeurs par défaut pour le développement local
(`DATABASE_URL`, `AUTH_SECRET`). Adaptez `DATABASE_URL` si nécessaire.

### 3. Installation & migration

```bash
npm install
npx prisma migrate dev   # crée le schéma
npx prisma db seed       # jeu de données de démonstration
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### 4. Tests

```bash
npm run test       # unitaires (Vitest) — logique métier pure, aucune base requise
npm run test:e2e   # E2E (Playwright) — nécessite le serveur de dev + une base seedée
```

Les tests E2E utilisent les comptes de démonstration (voir plus bas) sur la base locale ;
`npm run test:e2e` démarre `next dev` automatiquement s'il ne tourne pas déjà. Si le binaire
Chromium préinstallé sur votre machine ne correspond pas à la révision attendue par
`@playwright/test`, lancez `npx playwright install` (ou définissez la variable
`PLAYWRIGHT_CHROMIUM_PATH` pour pointer vers un Chromium déjà installé).

## Déploiement (Vercel + Neon)

1. **Neon** : créer un projet, copier la chaîne de connexion **pooled** (`...-pooler...neon.tech/...`).
2. **Vercel** : importer le dépôt GitHub, puis renseigner ces variables d'environnement
   (Project Settings → Environment Variables) :
   - `DATABASE_URL` — la chaîne Neon **pooled**
   - `DIRECT_URL` — la chaîne Neon **directe** (sans `-pooler` dans l'hôte, désactiver
     "Connection pooling" dans Neon pour l'obtenir). Utilisée uniquement pour les
     migrations : `prisma migrate deploy` échoue avec "Timed out trying to acquire
     a postgres advisory lock" si on lui passe une connexion PgBouncer.
   - `AUTH_SECRET` — générer avec `openssl rand -base64 32`
   - `AUTH_TRUST_HOST` — `true`
   - `SETUP_TOKEN` — une chaîne aléatoire, sert uniquement à protéger l'étape 4
3. **Vercel Blob** (upload de photos) : Storage → Create Database → Blob, puis connecter
   au projet. Vercel ajoute automatiquement `BLOB_READ_WRITE_TOKEN`. Sans cette étape,
   les formulaires de photo échouent silencieusement (aucune erreur visible, la photo
   n'est simplement pas enregistrée).
4. **Déployer.** La commande `build` (`prisma migrate deploy && next build`) crée
   automatiquement le schéma sur la base Neon à chaque déploiement.
5. **Charger les données de démonstration** (une seule fois, sur une base vide) : ouvrir
   `https://<votre-domaine-vercel>/api/setup?token=<SETUP_TOKEN>` dans le navigateur.
   L'opération est protégée par le token et sans effet si la base contient déjà des
   données (peut être rappelée sans risque).

### Comptes de démonstration

Mot de passe pour tous : `Password123!`

| Rôle           | Email                              |
|----------------|-------------------------------------|
| Direction      | `direction.demo@pitilink.local`     |
| Responsable    | `responsable.demo@pitilink.local`   |
| Professionnel  | `ana.demo@pitilink.local` / `julie.demo@pitilink.local` |
| Parent         | `parent.demo@pitilink.local` / `papa.demo@pitilink.local` |

Le jeu de données inclut une garderie de démonstration (« Les Petits Loups »), deux
groupes, trois enfants (dont **Kiivai**, avec une allergie renseignée et une journée déjà
remplie : arrivée, biberons, change, sieste, activité, humeur) et les affectations
correspondantes.

## Architecture

```
src/
  app/
    connexion/          espace public (login)
    pro/                espace professionnel (mobile-first)
    parent/             espace parent
    direction/          espace direction / responsable
    api/auth/           route NextAuth
  auth.ts               config NextAuth (Node — Prisma)
  auth.config.ts        config NextAuth "edge-safe" (partagée avec le proxy)
  proxy.ts              garde d'accès par rôle (ex-"middleware", renommé en Next 16)
  lib/                  session, requêtes Prisma partagées, formatage, journal
  generated/prisma/     client Prisma généré (ne pas éditer)
prisma/
  schema.prisma         modèle de données
  seed.ts               jeu de données de démonstration
```

### Modèle de données

Le modèle est construit autour de l'entité **Enfant** et d'un système d'**événements**
(`JournalEvenement`), avec isolation stricte par `garderieId` (multi-tenant). Chaque
événement porte un statut `PREVU` / `REALISE` et deux champs JSON (`donneesPrevues` /
`donneesReelles`) pour implémenter le modèle **prévu → réel → écart** décrit dans le
cahier des charges (ex. biberon prévu 150 ml / réel 120 ml).

### Rôles & accès

Les rôles (`PARENT`, `PROFESSIONNEL`, `RESPONSABLE`, `DIRECTION`, `ADMIN_PLATEFORME`)
déterminent l'espace accessible (`/parent`, `/pro`, `/direction`). Le fichier `src/proxy.ts`
redirige automatiquement chaque utilisateur vers son espace et bloque les autres routes.
Chaque Server Action revérifie en plus la session et le `garderieId` avant toute lecture/
écriture (défense en profondeur, isolation multi-garderie).

## Périmètre implémenté (MVP — cahier des charges §82)

**Professionnels** (`/pro`)
- Vue « Aujourd'hui » (mes enfants affectés, statut des événements du jour en un coup d'œil)
- Fiche enfant : informations importantes, présence (arrivée/départ), timeline de la journée
- Saisie rapide : biberon, repas, change, sieste (démarrer/réveillé avec durée calculée),
  humeur, activité, bain, observation libre
- Vue groupe (tableau multi-enfants) + action groupée (activité appliquée à plusieurs enfants)

**Parents** (`/parent`)
- Rapport quotidien auto-généré (aucune ressaisie), navigation veille/lendemain
- Menu du jour, petit mot, historique complet
- Transmission d'informations vers la garderie (« à savoir aujourd'hui »)
- Croissance (poids/taille/PC + historique), contacts d'urgence, personnes autorisées
- Déclaration d'absence (maladie/vacances/garde à domicile), avec certificat médical joint
  et incidence financière calculée automatiquement selon les règles de la garderie (§ règles
  de facturation ci-dessous) — pas de validation manuelle nécessaire
- Progrès de l'enfant : résumé par catégorie + timeline des compétences observées

**Direction** (`/direction`)
- Tableau de bord (présences du jour, alertes « à traiter »)
- Fiche enfant à onglets (Vue d'ensemble, Informations, Compétences, Documents, Historique) :
  gestion de deux parents maximum (rôle libre papa/maman/tuteur, indépendant l'un de l'autre —
  couvre les familles homoparentales), contact d'urgence principal, adresse, photo de profil,
  galerie de souvenirs, documents (upload)
- Droit à l'image : autorisation de diffusion des photos par enfant (non renseignée / autorisée /
  refusée par la famille), gérée par la direction. Tant qu'elle n'est pas explicitement
  « autorisée », l'ajout de photo (profil ou souvenir) est bloqué côté serveur pour tous les
  rôles (direction et professionnels), pas seulement masqué côté interface.
- Gestion des groupes, des professionnels (création de compte), des affectations
  (y compris réaffectation en cas d'absence d'une tatie)
- Gestion du catalogue de compétences (catégories, âges indicatifs, activation) et
  correction/suppression des acquisitions enregistrées
- Absences : liste consolidée avec incidence financière calculée (décomptée/facturée),
  règles paramétrables par garderie (préavis minimum, traitement de la maladie avec/sans
  certificat), annulation d'une absence. Il n'y a pas de « validation » manuelle : la règle
  s'applique automatiquement, chaque garderie ayant son propre fonctionnement.

**Menus** (`/direction/menus`, `/pro/menus`, onglet menu de la fiche parent)
- Trois niveaux de menu par semaine : général (garderie), par catégorie (groupe), individuel
  (enfant), avec résolution automatique individuel > catégorie > général et repli sur le
  niveau supérieur quand rien n'est défini
- Grille hebdomadaire (types de repas configurables × Lundi-Vendredi) : édition en liste de
  cases à cocher + note, « copier ce jour vers... », « dupliquer la semaine », historique des
  semaines conservé (jamais de suppression), navigation semaine précédente/en cours/suivante
- Statuts Brouillon / Publié / Archivé : modifier une semaine déjà publiée exige une case de
  confirmation explicite (protection contre la modification accidentelle) ; une semaine
  archivée n'est plus modifiable
- Allergènes et aliments gérés par la garderie (pas de liste figée dans le code), allergies de
  l'enfant reliées à ces allergènes ; détection automatique des conflits entre le menu
  réellement applicable à un enfant et ses allergies déclarées, avec vue « Alertes » dédiée
  (jamais de blocage silencieux : la garderie voit le conflit et l'enfant concerné)
- Substitutions tracées (aliment remplacé + motif), affichées sous la forme
  « ~~Poisson~~ → Poulet — Adapté à l'âge (bébés) »
- Vues Semaine / Par catégorie / Par enfant / Alertes côté direction (lecture + édition) et
  côté professionnel (lecture seule) ; le badge d'origine (🌐 Général / 🏷️ Catégorie /
  👶 Individuel) est toujours visible pour ne jamais confondre le menu réel avec le menu de
  base ; grille transformée en cartes verticales empilées sur mobile
- Menu du jour resolu affiché directement sur la fiche enfant côté parent

**Notifications** — v1 minimale, en application uniquement (pas de push/email) : une
notification est créée pour la direction quand un parent déclare une absence, et pour les
parents quand une nouvelle compétence est observée chez leur enfant. La cloche de l'en-tête
affiche les notifications réelles (non lues en gras) avec lien direct et action « tout
marquer comme lu ».

**Interface** — sidebar de navigation, recherche d'enfant, badges de notification, fiche
enfant à onglets avec tuiles colorées (« Aujourd'hui »), photo de profil et galerie de
souvenirs (upload via Vercel Blob), sur les trois espaces.

**Suivi du développement / compétences** (cahier des charges §90)
- Catalogue de compétences par catégorie (motricité, langage, socialisation, autonomie,
  éveil...), personnalisable par la garderie, avec âge indicatif facultatif
- Enregistrement en un clic côté pro, avec suggestions filtrées par âge de l'enfant et
  compétences déjà acquises (jamais de validation automatique)
- Note et lien photo optionnels ; traçabilité des corrections (auteur, date, note d'origine
  conservée) ; suppression réservée à la direction
- Espace parent : compteur de compétences par catégorie + timeline chronologique
- Aucun diagnostic, classement ou comparaison entre enfants : l'absence d'un badge signifie
  uniquement qu'il n'a pas encore été enregistré comme observé (§90.14)

## Non implémenté dans cette itération (roadmap V2 / V3 du CDC)

Le schéma de données prévoit déjà `Document`, `Absence`, `Message`/`Conversation`,
`Evenement` (calendrier) et `Notification`, mais leurs interfaces ne sont pas construites :

- Facturation complète, grille tarifaire détaillée (§42-46) — le calcul de l'incidence
  décomptée/facturée par absence est fait, pas l'édition de factures
- Albums organisés automatiquement, tri intelligent des photos, contrôle fin des droits de
  diffusion **par photo** (§35-38) — l'autorisation par enfant est faite, l'upload de base
  (profil, souvenirs, documents) est fait
- Messagerie parent ↔ garderie (le modèle existe, pas d'UI)
- Notifications push/email (l'en-tête a une vraie boîte de notifications en app, sur
  quelques événements seulement : absence déclarée, compétence observée)
- Mot de passe oublié en libre-service par email : nécessite de choisir un fournisseur
  d'envoi d'email (aucun n'est configuré). En attendant : chaque utilisateur peut changer
  son propre mot de passe depuis « Mon compte », et la direction peut réinitialiser celui
  d'un parent ou d'un professionnel de sa garderie sans passer par la base de données.
- Mode hors-connexion avec synchronisation (§59)
- Statistiques avancées (§61-62), export/transfert de dossier (§65-66)
- Paiement en ligne, IA de synthèse, tri intelligent des photos (V3, §84)

## Notes techniques

- **Prisma 7** requiert un driver adapter (`@prisma/adapter-pg`) : voir `src/lib/prisma.ts`.
  La configuration CLI vit dans `prisma.config.ts` (et non plus `datasource.url` dans le
  schéma).
- Next.js 16 a renommé la convention `middleware.ts` en `proxy.ts` (le fichier a été créé
  directement sous ce nom).
- `npm audit` signale des vulnérabilités dans des dépendances **de développement** de la
  CLI Prisma (support MySQL non utilisé ici, ce projet est en PostgreSQL) — elles n'affectent
  pas le runtime de l'application déployée.
