# BelEvent Frontend

Application frontend du SaaS BelEvent — plateforme de gestion événementielle pour prestataires et clients finaux, avec widget chat IA intégré (Leïa).

## Stack technique

| Techno                | Version | Rôle                                                      |
| --------------------- | ------- | --------------------------------------------------------- |
| **Nuxt 3**            | ^3.x    | Framework SSR/SSG (Vue 3 + TypeScript)                    |
| **Vue 3**             | ^3.5    | Composition API + `<script setup>`                        |
| **TypeScript**        | ^5.x    | Typage strict sur tout le projet                          |
| **Pinia**             | ^2.x    | State management (stores modulaires)                      |
| **VeeValidate 4**     | ^4.x    | Validation formulaires                                    |
| **Zod**               | ^3.x    | Schémas de validation TypeScript                          |
| **Sass**              | —       | CSS séparés (convention projet : pas de `<style>` inline) |
| **Stripe.js**         | ^4.x    | Checkout & Connect onboarding (côté client)               |
| **marked**            | ^14.x   | Parsing markdown (réponses IA)                            |
| **DOMPurify**         | ^3.x    | Sanitization HTML (anti-XSS)                              |
| **VueUse**            | ^11.x   | Composables utilitaires                                   |
| **Vitest**            | ^2.x    | Tests unitaires                                           |
| **Playwright**        | ^1.x    | Tests E2E                                                 |
| **ESLint + Prettier** | —       | Linting & formatting                                      |

## Architecture

Le projet couvre **3 espaces** distincts :

```
pages/
├── auth/          → Login, Register (wizard 3 étapes), First-login, Reset password
├── presta/        → Espace prestataire (dashboard, événements, clients, documents, account)
├── user/          → Espace utilisateur/client final (dashboard, événements, prestataires, documents)
└── widget/        → Widget chat Leïa (injectable en iframe sur sites externes)
```

### Layouts

| Layout         | Usage       | Description                             |
| -------------- | ----------- | --------------------------------------- |
| `LayoutAuth`   | `/auth/*`   | Centré, fond crème, card formulaire     |
| `LayoutPresta` | `/presta/*` | Header + sidebar + sélecteur entreprise |
| `LayoutUser`   | `/user/*`   | Header + sélecteur événement + cagnotte |
| `LayoutWidget` | `/widget/*` | Autonome (bulle flottante bottom-right) |

### State management (Pinia)

| Store          | Domaine                                   |
| -------------- | ----------------------------------------- |
| `auth`         | Utilisateur connecté, rôle, session       |
| `company`      | Entreprise(s), contacts, statut Stripe    |
| `clients`      | CRUD clients + recherche/filtres          |
| `events`       | Événements + prestataires liés            |
| `documents`    | Devis, factures, contrats + workflow      |
| `transactions` | Paiements Stripe + historique             |
| `chat`         | Widget Leïa (messages, SSE, conversation) |

### Conventions CSS

> **Règle projet : fichiers CSS/SCSS séparés obligatoires.**
> Pas de styles inline, pas de `<style>` dans les SFC sauf `scoped` minimal pour les layouts.

- Design tokens dans `assets/styles/_variables.scss`
- Mixins réutilisables dans `assets/styles/_mixins.scss`
- Chaque composant UI a son fichier `.scss` associé

### Design system (couleurs maquettes)

| Token             | Valeur    | Usage                                      |
| ----------------- | --------- | ------------------------------------------ |
| `$bel-primary`    | `#5A8A7A` | Teal — bordures, CTAs, navigation          |
| `$bel-accent`     | `#D4A843` | Gold — highlights, hover, sélection active |
| `$bel-bg-cream`   | `#F5F0E8` | Fond principal                             |
| `$bel-bg-warm`    | `#EDE8DF` | Fond secondaire (cards, inputs)            |
| `$bel-text-dark`  | `#2D2D2D` | Texte principal                            |
| `$bel-text-muted` | `#6B6560` | Texte secondaire                           |

## Sécurité

Points critiques implémentés ou à implémenter :

- **Auth** : JWT en cookies `httpOnly` + `Secure` + `SameSite=Lax` (jamais en localStorage)
- **XSS** : Réponses IA parsées avec `marked` + sanitizées avec `DOMPurify`. Jamais de `v-html` sur du contenu utilisateur brut
- **CSRF** : Cookies `SameSite=Lax` + token CSRF pour mutations sensibles
- **Widget** : Tourne en iframe (sandbox). API Key non exposée dans le HTML du site hôte. Rate limiting visible côté UI
- **Uploads** : Validation extension + taille côté client, magic bytes côté serveur
- **Routes** : Middleware Nuxt vérifie auth + rôle avant chaque rendu de page
- **Stripe** : Aucune donnée bancaire ne transite par BelEvent. Tout passe par Stripe Connect/Checkout

## Prérequis

- **Node.js** ≥ 20
- **pnpm** ≥ 9

## Installation

```bash
# Cloner le repo
git clone git@github.com:<org>/belevent-frontend.git
cd belevent-frontend

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env
# → Éditer .env avec les valeurs locales
```

## Développement

```bash
# Lancer le serveur de dev (port 3000)
pnpm dev

# Lancer les tests unitaires
pnpm test

# Lancer les tests E2E
pnpm test:e2e

# Linter
pnpm lint
```

## Build & déploiement

```bash
# Build SSR
pnpm build

# Preview du build
pnpm preview
```

Le frontend est déployé sur **Vercel** (SSR Nuxt) ou **Scalingo** (avec le backend).

## Communication avec le backend

| Protocole     | Usage                          | Auth                |
| ------------- | ------------------------------ | ------------------- |
| REST (ofetch) | CRUD, formulaires, actions     | JWT cookie          |
| SSE (Mercure) | Chat temps réel, notifications | JWT / API Key       |
| Stripe.js     | Paiements, onboarding Connect  | Clé publique Stripe |

L'API backend tourne sur Symfony 7 + API Platform et expose les endpoints sur `/api/`.

## Structure des dossiers

```
belevent-frontend/
├── app/
│   ├── layouts/           # LayoutAuth, LayoutPresta, LayoutUser, LayoutWidget
│   ├── middleware/         # auth, presta, user, guest, first-login
│   └── plugins/           # stripe.client.ts, mercure.client.ts, api.ts
├── assets/
│   ├── styles/            # _variables.scss, _mixins.scss, main.scss
│   └── images/            # Logo, icônes, avatars
├── components/
│   ├── ui/                # BelButton, BelInput, BelCard, BelModal, BelTable...
│   ├── presta/            # Composants spécifiques prestataire
│   ├── user/              # Composants spécifiques utilisateur
│   ├── shared/            # DocumentCard, EventRow, StatusIcon...
│   └── widget/            # ChatWindow, ChatBubble, ChatInput, ContactForm
├── composables/           # useApi, useAuth, useStripe, useMercure, useSiret
├── pages/                 # Auto-routing Nuxt (file-based)
├── stores/                # Pinia stores (auth, company, clients, events, documents, chat)
├── tests/
│   ├── unit/              # Vitest
│   └── e2e/               # Playwright
└── types/                 # Interfaces TypeScript (miroir entités backend)
```

## Liens

- **Backend** : `belevent-backend` (Symfony 7 + API Platform)
- **Maquettes** : PDF 34 pages (côté prestataire p.1-20, côté utilisateur p.21-34)
- **Specs frontend** : `BelEvent_Specs_Frontend.docx`
- **Specs backend** : `BelEvent_Specifications_Backend.md`
