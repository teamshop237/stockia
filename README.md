# StockIA

Voir [CLAUDE.md](./CLAUDE.md) pour le contexte produit, le schéma SQL et les
décisions techniques.

## Démarrage local

1. `npm install`
2. Copier `.env.example` vers `.env.local` et renseigner l'URL et la clé
   `anon` de ton projet Supabase (Settings → API).
3. `npm run dev`

## Déploiement (Vercel)

Le frontend (Vite/React) se déploie sur Vercel ; le backend (base de données,
auth, Edge Function IA) reste entièrement sur Supabase — il n'y a rien à
déployer côté serveur pour Vercel.

1. Importer le dépôt GitHub dans Vercel (aucune configuration de build
   nécessaire, Vercel détecte Vite automatiquement).
2. Dans **Project Settings → Environment Variables**, ajouter `VITE_SUPABASE_URL`
   et `VITE_SUPABASE_ANON_KEY` avec les valeurs du projet Supabase de
   **production** (peuvent différer de celles utilisées en local si tu as des
   projets Supabase séparés dev/prod). Ne jamais committer ces valeurs dans
   le repo — elles vivent uniquement dans `.env.local` (dev, gitignored) et
   dans les variables d'environnement Vercel (prod).
3. `vercel.json` contient déjà la règle de réécriture nécessaire pour que le
   routage côté client (React Router) fonctionne sur un rechargement direct
   d'une route comme `/dashboard` (sans ça, Vercel renverrait une 404).
4. La clé `ANTHROPIC_API_KEY` ne doit **jamais** être ajoutée à Vercel — elle
   reste uniquement dans les secrets d'Edge Function Supabase, puisque le
   frontend ne l'utilise jamais directement.
5. Avant de mettre en prod, réactiver **"Confirm email"** dans Supabase
   (Authentication → Sign In / Providers) si tu l'avais désactivé pour tester
   plus vite en dev.
