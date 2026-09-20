# PitiLink

Application de gestion, suivi et communication **Garderie ↔ Parents**, développée à partir
du cahier des charges fonctionnel v1.0 (voir résumé du périmètre plus bas).

Principe directeur : *« La garderie ne doit pas travailler pour l'application. L'application
doit travailler pour la garderie. »* — saisie minimale, gros boutons, préremplissage,
modèle **prévu → réel**.

## Stack technique

- **Next.js 16** (App Router, React 19, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma ORM 7** (driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials, sessions JWT, multi-tenant par garderie, rôles)
- **TailwindCSS v4** — design mobile-first (gros boutons, pictogrammes, faible densité)
- Server Actions (Next.js) pour toutes les mutations — pas d'API REST séparée

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
- Déclaration d'absence (maladie/vacances/garde à domicile)
- Progrès de l'enfant : résumé par catégorie + timeline des compétences observées

**Direction** (`/direction`)
- Tableau de bord (présences du jour, alertes « à traiter »)
- Gestion des enfants (création, statut, groupe, informations importantes)
- Gestion des groupes, des professionnels (création de compte), des affectations
  (y compris réaffectation en cas d'absence d'une tatie)
- Gestion des menus du jour
- Gestion du catalogue de compétences (catégories, âges indicatifs, activation) et
  correction/suppression des acquisitions enregistrées

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

- Facturation complète, grille tarifaire, règles d'absence configurables (§42-46)
- Upload de documents/ordonnances, albums photo, tri intelligent des photos (§28, 35-38)
- Messagerie parent ↔ garderie (le modèle existe, pas d'UI)
- Notifications push/email
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
