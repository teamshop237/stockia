# Déploiement — StockIA sur Cloudflare

Le frontend (Vite / React) est déployé sur **Cloudflare Workers (Static Assets)**,
l'approche recommandée aujourd'hui par Cloudflare pour un SPA. Le backend (base
de données, auth, Edge Function IA) reste entièrement sur **Supabase**.

Le repo contient déjà tout le nécessaire :

- `wrangler.jsonc` — configuration Cloudflare (`dist/` + routage SPA)
- `wrangler` en `devDependencies`
- scripts `npm run deploy` et `npm run cf:preview`

---

## 1. Avant le premier déploiement

**Vérifie `.env.local`.** Vite fige les variables `VITE_*` **au moment du build**,
côté client. Le build lancé depuis ta machine utilise donc les valeurs de
`.env.local` — assure-toi que ce sont bien celles du projet Supabase de
**production** (Supabase → Settings → API) :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Aucune variable d'environnement n'est à créer côté Cloudflare avec cette
méthode. La clé `ANTHROPIC_API_KEY` ne doit **jamais** apparaître ici : elle
reste dans les secrets d'Edge Function Supabase.

---

## 2. Déployer (terminal VS Code)

```bash
npm install
npx wrangler login      # ouvre le navigateur, une seule fois
npm run deploy          # build + déploiement
```

`npm run deploy` enchaîne `tsc -b && vite build` puis `wrangler deploy`. À la fin,
Wrangler affiche l'URL du site :

```
https://stockia.<ton-sous-domaine>.workers.dev
```

Pour redéployer après une modification : `npm run deploy`, rien d'autre.

Pour tester le rendu exact de production en local avant de publier :
`npm run cf:preview`.

---

## 3. Après le premier déploiement

### Supabase — URLs d'authentification

Sans ça, les liens de confirmation d'email et les redirections après login
pointeront toujours vers `localhost`.

Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://stockia.<ton-sous-domaine>.workers.dev`
- **Redirect URLs** : ajouter la même URL (garder `http://localhost:5173`
  pour continuer à développer en local)

### Supabase — confirmation d'email

Si tu avais désactivé **Confirm email** pour tester plus vite en dev
(Authentication → Sign In / Providers), réactive-le avant d'ouvrir le site à de
vrais utilisateurs.

### Supabase — Edge Function IA

L'analyse IA (`supabase/functions/analyze-stock`) tourne sur Supabase, pas sur
Cloudflare. Si elle n'est pas encore déployée sur le projet de production :

```bash
npx supabase functions deploy analyze-stock
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Le CORS de la fonction est déjà en `*`, il n'y a rien à changer pour la
nouvelle origine.

### Domaine personnalisé (optionnel)

Cloudflare Dashboard → **Workers & Pages → stockia → Settings → Domains &
Routes → Add → Custom domain**. Le domaine doit être sur ton compte Cloudflare ;
le certificat TLS est automatique. Pense à remettre à jour la Site URL Supabase
avec le nouveau domaine.

---

## 4. Vérifications post-déploiement

- [ ] La page d'accueil charge
- [ ] Rechargement direct sur `/dashboard` → pas de 404 (routage SPA)
- [ ] Signup + email de confirmation reçu, lien qui pointe vers le bon domaine
- [ ] Login, création d'un produit, analyse IA
- [ ] Console navigateur sans erreur Supabase (URL / clé anon correctes)

---

## Notes

- `public/_redirects` et `vercel.json` restent dans le repo pour Netlify /
  Vercel, mais ne servent pas ici : le routage SPA est géré par
  `not_found_handling: "single-page-application"` dans `wrangler.jsonc`.
- **Déploiement automatique sur push** : possible en poussant le repo sur GitHub
  puis en connectant Cloudflare (Workers & Pages → Create → Connect to Git),
  build command `npm run build`, output `dist`. Dans ce cas il faut déclarer
  `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables
  d'environnement Cloudflare, puisque le build se fait chez eux.
