# Temporis ⏳

<div align="center">

**[Français](#français)** · **[English](#english)**

</div>

---

## Français

### 📋 Présentation

Bienvenue sur le code source de **Temporis**. J'avais envie de créer une application de messagerie qui soit véritablement éphémère et ultra-sécurisée. L'idée : un espace d'échange anonyme, en tête-à-tête, où aucun message en clair ne touche jamais un serveur, et où tout s'autodétruit à la seconde où la conversation est terminée. Le résultat est Temporis : un chat chiffré de bout en bout (E2EE) directement dans le navigateur.

### 📑 Les fonctionnalités

| Fonctionnalité             | Ce que ça fait sous le capot                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chiffrement E2EE**       | L'API Web Crypto (AES-GCM) chiffre/déchiffre les messages côté client. Le serveur ne relaie que des paquets illisibles.                                    |
| **Secret Absolu**          | La clé AES est générée dans votre navigateur et envoyée à l'autre participant via l'ancre de l'URL (`#key=...`). Elle n'est **jamais** envoyée au serveur. |
| **Temps Réel**             | WebSockets alimentés par Upstash Realtime pour une latence minimale.                                                                                       |
| **Autodestruction**        | Chaque salon possède un TTL strict (jusqu'à 30 min).                                                                                                       |
| **Fermeture intelligente** | Si les 2 participants quittent le salon (fermeture de l'onglet), tout est **immédiatement effacé** (Option Destruction Instantanée).                       |
| **Tolérance au F5**        | Un système de "Ping" de 2 secondes permet de différencier un rafraîchissement de page d'une vraie déconnexion, évitant de détruire le salon par erreur.    |

### 🔒 Sécurité et Chiffrement

J'ai pris le temps de verrouiller l'architecture de la messagerie :

- La clé AES-256-GCM est convertie en Base64URL sécurisé pour être placée dans l'URL.
- Chaque message possède son propre vecteur d'initialisation (IV) généré aléatoirement.
- Le serveur utilise le middleware d'ElysiaJS pour distribuer des `x-auth-token` sous forme de cookies HttpOnly, limitant l'accès au salon strictement à 2 personnes.

### 🛠 Stack technique

| Catégorie       | Technologies                    |
| --------------- | ------------------------------- |
| Framework       | Next.js 16 (App Router) + React |
| Langage         | TypeScript                      |
| Backend API     | ElysiaJS (Eden)                 |
| Package manager | Bun                             |
| Styling         | Tailwind CSS v4                 |
| Base de données | Upstash Redis                   |
| Temps Réel      | Upstash Realtime                |
| Chiffrement     | Web Crypto API (AES-GCM)        |
| Qualité de code | ESLint v9 + Prettier            |

### 📁 Structure du projet

```text
Temporis/
├── src/
│   ├── app/
│   │   ├── (lobby)/                 # Page d'accueil (création de salon)
│   │   ├── api/                     # Backend API
│   │   │   ├── realtime/            # Émission de tokens WebSocket
│   │   │   └── [[...slugs]]/        # Routes de l'API Elysia
│   │   │       ├── auth.ts          # Middleware de sécurité (cookies, places)
│   │   │       └── route.ts         # Endpoints (create, join, leave, messages)
│   │   ├── join/[roomId]/           # Page de redirection pour les invités
│   │   └── room/[roomId]/           # Salon de chat chiffré E2EE
│   ├── components/                  # Composants UI
│   │   ├── common/                  # UI partagée (Boutons, Badges, Fonds)
│   │   ├── lobby/                   # Configuration du salon (Durée, etc.)
│   │   └── room/                    # Panneau de chat, champ de saisie, header
│   ├── hooks/                       # Logique client complexe
│   │   ├── use-room-chat.tsx        # Récupération & Chiffrement/Déchiffrement
│   │   ├── use-room-session.ts      # Gestion F5, beforeunload et Ping
│   │   └── use-chat-viewport.ts     # Défilement automatique intelligent
│   ├── lib/                         # Utilitaires métier
│   │   ├── crypto.ts                # Wrapper Web Crypto API AES-GCM
│   │   ├── redis.ts                 # Client Upstash Redis
│   │   ├── realtime.ts              # Client Upstash Realtime
│   │   └── client.ts                # Client Eden (Elysia) typé de bout en bout
│   └── proxy.ts                     # Middleware Next.js : Restriction d'accès
├── .env                             # Clés Upstash
├── bun.lock
├── eslint.config.mjs
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

Je suis Ruddy Autem, développeur Full Stack. Si le code vous inspire ou que vous voulez discuter, n'hésitez pas — vous me trouverez sur [autem.dev](https://autem.dev) ou [GitHub](https://github.com/ruddyautem).

---

## English

### 📋 Overview

Welcome to the source code of **Temporis**. I wanted to create a messaging app that is truly ephemeral and highly secure. The idea: an anonymous, one-on-one chat space where no plaintext message ever touches a server, and everything self-destructs the moment the conversation ends. The result is Temporis: an End-to-End Encrypted (E2EE) chat built directly in the browser.

### 📑 Key Features

| Feature              | Under the hood                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E2EE Encryption**  | The Web Crypto API (AES-GCM) encrypts/decrypts messages client-side. The server only relays unreadable packets.                                       |
| **Absolute Secrecy** | The AES key is generated in your browser and shared with the other user via the URL fragment anchor (`#key=...`). It is **never** sent to the server. |
| **Real-Time**        | WebSockets powered by Upstash Realtime for minimal latency.                                                                                           |
| **Auto-destruction** | Every room has a strict TTL (up to 30 min).                                                                                                           |
| **Smart teardown**   | If both participants leave the room (tab closure), everything is **instantly wiped** (Instant Destruction Option).                                    |
| **F5 Tolerance**     | A 2-second "Ping" system differentiates a page refresh from a true disconnect, preventing accidental room destruction.                                |

### 🔒 Security and Encryption

I took the time to tightly secure the messaging architecture:

- The AES-256-GCM key is converted to a URL-safe Base64URL string to fit in the URL.
- Every message has its own randomly generated Initialization Vector (IV).
- The server uses ElysiaJS middleware to issue `x-auth-token` HttpOnly cookies, strictly limiting room access to exactly 2 people.

### 🛠 Tech stack

| Category        | Technologies                    |
| --------------- | ------------------------------- |
| Framework       | Next.js 16 (App Router) + React |
| Language        | TypeScript                      |
| Backend API     | ElysiaJS (Eden)                 |
| Package manager | Bun                             |
| Styling         | Tailwind CSS v4                 |
| Database        | Upstash Redis                   |
| Real-Time       | Upstash Realtime                |
| Encryption      | Web Crypto API (AES-GCM)        |
| Code quality    | ESLint v9 + Prettier            |

### 📁 Project structure

```text
Temporis/
├── src/
│   ├── app/
│   │   ├── (lobby)/                 # Home page (room creation)
│   │   ├── api/                     # Backend API
│   │   │   ├── realtime/            # WebSocket token issuance
│   │   │   └── [[...slugs]]/        # Elysia API Routes
│   │   │       ├── auth.ts          # Security middleware (cookies, capacity)
│   │   │       └── route.ts         # Endpoints (create, join, leave, messages)
│   │   ├── join/[roomId]/           # Redirection page for invitees
│   │   └── room/[roomId]/           # E2EE Chat room
│   ├── components/                  # UI Components
│   │   ├── common/                  # Shared UI (Buttons, Badges, Backgrounds)
│   │   ├── lobby/                   # Room configuration (Duration, etc.)
│   │   └── room/                    # Chat panel, composer, header
│   ├── hooks/                       # Complex client logic
│   │   ├── use-room-chat.tsx        # Data fetching & Encrypt/Decrypt
│   │   ├── use-room-session.ts      # F5, beforeunload and Ping management
│   │   └── use-chat-viewport.ts     # Smart auto-scrolling
│   ├── lib/                         # Business utilities
│   │   ├── crypto.ts                # Web Crypto API AES-GCM wrapper
│   │   ├── redis.ts                 # Upstash Redis client
│   │   ├── realtime.ts              # Upstash Realtime client
│   │   └── client.ts                # End-to-end typed Eden client (Elysia)
│   └── proxy.ts                     # Next.js Middleware: Access restriction
├── .env                             # Upstash keys
├── bun.lock
├── eslint.config.mjs
├── package.json
└── README.md
```

### 🚀 Running it locally

```bash
git clone <repo-url>
cd temporis

bun install
bun run dev
```

Then head to [http://localhost:3000](http://localhost:3000).

> 💡 **Requirements:** You will need a Redis database and a Realtime endpoint from [Upstash](https://upstash.com/). Fill in the corresponding variables in a `.env` file.

### About me

I'm Ruddy Autem, a Full Stack developer. If the code speaks to you or you just want to say hi, feel free — you'll find me at [autem.dev](https://autem.dev) or on [GitHub](https://github.com/ruddyautem).
