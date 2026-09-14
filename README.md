# Temporis ⏳

<div align="center">

**[Français](#français)** · **[English](#english)**

</div>

---

## Français

### 📋 Présentation

Bienvenue sur le code source de **Temporis**. Une application de messagerie véritablement éphémère, anonyme et ultra-sécurisée. L'idée : un espace d'échange où aucun message en clair ne touche jamais un serveur, et où tout s'autodétruit dès la fin de la conversation. Le résultat est Temporis : un chat chiffré de bout en bout (E2EE) avec une expérience soignée, tactile et réactive.

### 📑 Les fonctionnalités

| Fonctionnalité | Ce que ça fait sous le capot |
| --- | --- |
| **Chiffrement E2EE** | L'API Web Crypto (`AES-GCM` 256-bit) chiffre et déchiffre les messages côté client. Le serveur ne relaie que des paquets illisibles. |
| **Secret Absolu** | La clé AES est générée dans le navigateur et transmise via le fragment d'URL (`#key=...`). Elle n'est **jamais** envoyée au serveur. |
| **Temps Réel** | WebSockets alimentés par Upstash Realtime pour une latence minimale. |
| **Autodestruction & TTL** | Chaque room dispose d'un compte à rebours strict (5, 15 ou 30 min) matérialisé par une jauge laser. À expiration, toutes les données sont purgées de Redis. |
| **Sélecteur de durée tactile** | Sélecteur de temps ergonomique sous forme de curseur tactile avec paliers visuels tactiques (5, 15 et 30 min), segments cliquables et remplissage dynamique. |
| **Période de grâce de 10s** | Lorsqu'un utilisateur ferme son onglet ou actualise sa page (F5), un délai de grâce de 10 secondes est accordé. S'il ne revient pas, son départ est notifié et sa place est automatiquement libérée dans Redis. |
| **Fermeture intelligente** | Si les 2 participants quittent la room ou cliquent sur "Détruire", la room et ses messages sont **immédiatement effacés**. |
| **Notifications Sonner empilées** | Système de notifications toasts unifié et typé qui se superpose élégamment en pile en cas d'événements multiples. |
| **Internationalisation complète** | Support bilingue Français / Anglais avec sélecteur de langue dynamique (`next-intl`), rendu avec de vrais drapeaux vectoriels SVG (compatibilité totale Chrome Windows/Linux/macOS/mobile). |
| **Responsive Design Cyberpunk** | Interface sombre cyberpunk soignée, optimisée pour mobile et desktop, avec footer compact ajusté directement sous les conteneurs. |

### 🔒 Sécurité et Chiffrement

L'architecture technique est conçue pour garantir une confidentialité maximale :

- **AES-256-GCM** : Clé symétrique générée via `crypto.subtle.generateKey` et sérialisée en Base64URL sécurisé dans l'ancre d'URL (`#key=...`).
- **IV Aléatoire unique** : Chaque message génère un vecteur d'initialisation (12 octets) aléatoire distinct.
- **Contrôle d'accès strict** : Le middleware backend (`proxy.ts` et Elysia `authMiddleware`) distribue des jetons sous forme de cookies HttpOnly `SameSite=Strict` limitant l'accès à la room strictement à 2 personnes simultanées.
- **Zéro fuite de données** : Les messages en clair ne sont jamais enregistrés en base ni loggés sur le serveur.

### 🛠 Stack technique

| Catégorie | Technologies |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Langage | TypeScript (typage strict de bout en bout) |
| Backend API | ElysiaJS (Eden Treaty) |
| Runtime & Packages | Bun |
| Styling | Tailwind CSS v4 + animations CSS |
| Base de données | Upstash Redis |
| Temps Réel | Upstash Realtime (WebSockets) |
| Chiffrement | Web Crypto API (`AES-GCM`) |
| Internationalisation | `next-intl` (Français / English) |
| Notifications | Sonner |
| Qualité de code | ESLint v9 + Prettier |

### 📁 Structure du projet

```text
Temporis/
├── src/
│   ├── app/
│   │   ├── (lobby)/                 # Page d'accueil (création de room & join)
│   │   │   ├── join/[roomId]/       # Écran d'invitation pour le 2ème participant
│   │   │   ├── layout.tsx           # Layout lobby avec header et footer adaptatif
│   │   │   └── page.tsx             # Configuration de la room
│   │   ├── api/                     # Backend API
│   │   │   ├── realtime/            # Émission de tokens WebSocket
│   │   │   └── [[...slugs]]/        # Routes de l'API Elysia
│   │   │       ├── auth.ts          # Middleware de sécurité (cookies, vérification token)
│   │   │       └── route.ts         # Endpoints (create, join, leave avec lock 10s, messages)
│   │   └── room/[roomId]/           # Chat de la room, chiffré E2EE
│   ├── components/                  # Composants UI
│   │   ├── common/                  # UI partagée (BrandMark, LanguageSwitcher avec SVG, Fond)
│   │   ├── lobby/                   # Configuration de la room (slider de durée, statut)
│   │   ├── room/                    # Header (Partager, Détruire), panneau de chat, input
│   │   ├── Footer.tsx               # Footer responsive et compact
│   │   └── ToastProvider.tsx        # Configuration des toasts Sonner empilables
│   ├── hooks/                       # Logique client réactive
│   │   ├── use-room-chat.tsx        # Récupération, déchiffrement & gestion des messages
│   │   ├── use-room-session.ts      # Gestion F5, pagehide/beforeunload & libération de place
│   │   ├── use-room-countdown.ts    # Compte à rebours temps réel synchronisé
│   │   └── use-chat-viewport.ts     # Défilement automatique intelligent
│   ├── lib/                         # Utilitaires métier
│   │   ├── crypto.ts                # Wrapper Web Crypto API AES-GCM
│   │   ├── redis.ts                 # Client Upstash Redis
│   │   ├── realtime.ts              # Client Upstash Realtime
│   │   ├── room-config.ts           # Constantes et durées de room
│   │   └── client.ts                # Client Eden (Elysia) typé de bout en bout
│   └── proxy.ts                     # Middleware Next.js : Contrôle d'accès & redirection
├── messages/                        # Dictionnaires de traduction (fr.json, en.json)
├── .env                             # Clés Upstash (Redis & Realtime)
├── bun.lock
├── package.json
└── README.md
```

### 🚀 Pour lancer le projet

```bash
git clone <url-du-repo>
cd temporis

bun install
bun run dev
```

Direction [http://localhost:3000](http://localhost:3000).

> 💡 **Prérequis :** Vous aurez besoin d'une base de données Redis et d'un endpoint Realtime chez [Upstash](https://upstash.com/). Renseignez les variables correspondantes dans un fichier `.env`.

### À propos de moi

Je suis Ruddy Autem, développeur Full Stack. Si le code vous inspire ou que vous voulez échanger, n'hésitez pas — vous me trouverez sur [autem.dev](https://autem.dev) ou [GitHub](https://github.com/ruddyautem).

---

## English

### 📋 Overview

Welcome to the source code of **Temporis**. A truly ephemeral, anonymous, and ultra-secure messaging application. The concept: a private, one-on-one conversation space where no plaintext message ever touches a server, and everything self-destructs the moment the chat concludes. The result is Temporis: an End-to-End Encrypted (E2EE) chat featuring a responsive, tactical cyberpunk user experience.

### 📑 Key Features

| Feature | Under the hood |
| --- | --- |
| **E2EE Encryption** | The Web Crypto API (`AES-GCM` 256-bit) encrypts and decrypts messages client-side. The server only relays unreadable payloads. |
| **Absolute Secrecy** | The AES key is generated in your browser and shared via the URL fragment anchor (`#key=...`). It is **never** transmitted to the server. |
| **Real-Time Delivery** | WebSockets powered by Upstash Realtime for near-instant message delivery. |
| **Auto-destruction & TTL** | Every room enforces a strict countdown (5, 15, or 30 min) visualized with a laser bar. Upon expiration, all room data is completely purged from Redis. |
| **Tactile Duration Slider** | Custom interactive slider with discrete tactical step blocks (5, 15, 30 min), full hit-box clickability, and fluid progress fill. |
| **10-Second Grace Period** | When a user closes their tab or refreshes (F5), a 10-second grace window is granted. If they do not return, a leave notification is broadcast and their seat is released in Redis. |
| **Smart Teardown** | When both participants leave or explicitly trigger "Destroy", the room and its messages are **instantly deleted**. |
| **Stacked Toast Notifications** | Clean Sonner toast integration that elegantly stacks notifications upon successive room events. |
| **Full Internationalization** | Bilingual French / English experience (`next-intl`), rendered with crisp vector SVG flags for cross-browser consistency (Windows Chrome, mobile, etc.). |
| **Cyberpunk Responsive UI** | Polished cyberpunk dark aesthetic, optimized for mobile and desktop, featuring a compact footer positioned directly under the room card. |

### 🔒 Security and Encryption

The technical architecture is built for privacy from the ground up:

- **AES-256-GCM**: Symmetric encryption key generated via `crypto.subtle.generateKey` and encoded into a safe Base64URL string placed in the URL hash (`#key=...`).
- **Unique Random IV**: A fresh 12-byte initialization vector is generated for each individual message.
- **Strict Capacity Control**: Backend middleware (`proxy.ts` and Elysia `authMiddleware`) assigns session cookies (`HttpOnly`, `SameSite=Strict`), strictly capping attendance at 2 concurrent users per room.
- **Zero Plaintext Storage**: Plaintext content is never written to disk, database, or server logs.

### 🛠 Tech Stack

| Category | Technologies |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (full end-to-end strict typing) |
| Backend API | ElysiaJS (Eden Treaty) |
| Runtime & Package Manager | Bun |
| Styling | Tailwind CSS v4 + CSS Animations |
| Database | Upstash Redis |
| Real-Time | Upstash Realtime (WebSockets) |
| Encryption | Web Crypto API (`AES-GCM`) |
| Internationalization | `next-intl` (French / English) |
| Notifications | Sonner |
| Code Quality | ESLint v9 + Prettier |

### 📁 Project Structure

```text
Temporis/
├── src/
│   ├── app/
│   │   ├── (lobby)/                 # Home & Join page routes
│   │   │   ├── join/[roomId]/       # Invitation screen for the 2nd user
│   │   │   ├── layout.tsx           # Lobby layout with adaptive header & footer
│   │   │   └── page.tsx             # Room setup & creation
│   │   ├── api/                     # Backend API
│   │   │   ├── realtime/            # WebSocket token issuance
│   │   │   └── [[...slugs]]/        # Elysia API routes
│   │   │       ├── auth.ts          # Security middleware (cookies, token validation)
│   │   │       └── route.ts         # Endpoints (create, join, leave with 10s lock, messages)
│   │   └── room/[roomId]/           # E2EE Chat room page
│   ├── components/                  # UI Components
│   │   ├── common/                  # Shared UI (BrandMark, LanguageSwitcher with SVG flags, Background)
│   │   ├── lobby/                   # Room configuration (duration slider, status banner)
│   │   ├── room/                    # Header (Share, Destroy), chat panel, composer
│   │   ├── Footer.tsx               # Compact, responsive footer
│   │   └── ToastProvider.tsx        # Stackable Sonner toast configuration
│   ├── hooks/                       # Reactive client hooks
│   │   ├── use-room-chat.tsx        # Message fetching, encryption/decryption & events
│   │   ├── use-room-session.ts      # Refresh/unload handling (pagehide/beforeunload) & slot release
│   │   ├── use-room-countdown.ts    # Synchronized room timer
│   │   └── use-chat-viewport.ts     # Intelligent auto-scrolling
│   ├── lib/                         # Core utilities
│   │   ├── crypto.ts                # Web Crypto API AES-GCM wrapper
│   │   ├── redis.ts                 # Upstash Redis client
│   │   ├── realtime.ts              # Upstash Realtime client
│   │   ├── room-config.ts           # Room duration constants
│   │   └── client.ts                # End-to-end typed Eden client (Elysia)
│   └── proxy.ts                     # Next.js Middleware: Access control & redirection
├── messages/                        # Translation files (fr.json, en.json)
├── .env                             # Upstash keys (Redis & Realtime)
├── bun.lock
├── package.json
└── README.md
```

### 🚀 Running Locally

```bash
git clone <repo-url>
cd temporis

bun install
bun run dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

> 💡 **Requirements:** You will need an Upstash Redis database and an Upstash Realtime endpoint. Configure them in your `.env` file.

### About Me

I'm Ruddy Autem, a Full Stack developer. If you enjoy the project or want to connect, feel free to visit [autem.dev](https://autem.dev) or [GitHub](https://github.com/ruddyautem).
