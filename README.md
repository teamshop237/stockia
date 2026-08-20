# StockIA

Voir [CLAUDE.md](./CLAUDE.md) pour le contexte produit, le schéma SQL et les
décisions techniques.

## Démarrage local

1. `npm install`
2. Copier `.env.example` vers `.env.local` et renseigner l'URL et la clé
   `anon` de ton projet Supabase (Settings → API).
3. `npm run dev`

## Déploiement (Cloudflare)

Le frontend est déployé sur Cloudflare Workers (Static Assets) ; le backend
(base de données, auth, Edge Function IA) reste sur Supabase.

```bash
npx wrangler login   # une seule fois
npm run deploy       # build + déploiement
```

Voir [DEPLOY.md](./DEPLOY.md) pour la procédure complète : variables
d'environnement, configuration Supabase à faire après la mise en ligne,
domaine personnalisé et checklist de vérification.

`public/_redirects` et `vercel.json` restent dans le repo au cas où tu
redéploierais un jour sur Netlify ou Vercel, mais ne sont pas utilisés par
Cloudflare — le routage SPA est géré par `wrangler.jsonc`.
