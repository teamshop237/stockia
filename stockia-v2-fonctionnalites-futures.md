# StockIA — Fonctionnalités candidates pour la suite (V2+)

Ce document liste des fonctionnalités possibles au-delà de la V1, à valider
une par une. Rien ici n'est codé — c'est une liste de propositions triées par
priorité, pas un engagement. Cocher/valider les lignes voulues, je les
implémente ensuite dans l'ordre choisi.

Chaque idée reste dans l'esprit du produit (voir CLAUDE.md) : générique pour
tout secteur, IA optionnelle et jamais bloquante.

---

## Priorité 1 — Débloquent l'usage réel en pilote

Ce sont les manques qui empêchent un vrai client de démarrer ou de continuer
à utiliser l'outil au quotidien.

- **Import CSV/Excel du stock existant** — sans ça, un pilote doit ressaisir
  tout son stock à la main avant même de voir la valeur du produit. C'est le
  plus gros frein à l'adoption identifié jusqu'ici.
- **Historique des mouvements de stock (entrées/sorties)** — dès qu'un
  deuxième utilisateur touche au stock, "qui a changé quoi et quand" devient
  indispensable, pas juste utile.
- **Plusieurs utilisateurs par entreprise avec rôles** (déjà prévu dans le
  schéma : `profiles.role` existe déjà) — un gérant seul peut vivre sans,
  mais dès qu'il a un employé, c'est bloquant.
- **Notifications de rupture proche** (email, au minimum) — le dashboard
  affiche déjà les produits sous le seuil, mais ça suppose que quelqu'un
  pense à ouvrir l'app. Une alerte envoyée est plus fiable.

## Priorité 2 — Renforcent la valeur sans être vitales

- **Export du stock (CSV/Excel)** — utile pour la compta ou un fournisseur,
  demandé tôt par les entreprises habituées à Excel.
- **Gestion des dates de péremption** — indispensable pour pharmacie/
  restaurant/épicerie, inutile pour quincaillerie/électronique. À activer
  par secteur plutôt qu'imposer à tous.
- **Recherche/filtre avancé** (par catégorie, par fournisseur, tri par
  valeur ou quantité) — la V1 a une recherche simple, ça peut vite manquer
  passé quelques centaines de références.
- **Statistiques avancées** (produits les plus vendus, rotation du stock,
  tendances sur plusieurs mois) — s'appuie sur l'historique des mouvements
  ci-dessus, donc vient logiquement après.
- **Scan de code-barres** (via caméra mobile) — accélère beaucoup la saisie
  en boutique/quincaillerie, mais demande un vrai travail mobile.

## Priorité 3 — Utile mais non urgent, ou dépend d'un choix business

- **Paiement en ligne automatisé** (abonnement Stripe ou équivalent) —
  aujourd'hui géré à la main ; à automatiser une fois qu'il y a plusieurs
  clients payants, pas avant.
- **Gestion multi-entrepôts / multi-emplacements** — pertinent pour
  grossiste/entrepôt, hors sujet pour une boutique avec un seul point de
  vente.
- **Suivi fournisseurs et commandes** (qui commander, historique des
  commandes passées) — complète bien les recommandations IA existantes.
- **Accès API / intégrations** (ex. connecter une caisse existante) —
  seulement si un client le demande explicitement, sinon effort disproportionné.
- **Application mobile dédiée** — le web répond déjà en mobile (vérifié en
  V1) ; une vraie app n'apporte de valeur que si le scan code-barres ou le
  mode hors-ligne devient prioritaire.

---

## Suggestion de méthode

Valider dans l'ordre de priorité 1 → 2 → 3, mais laisser le retour du
premier pilote client (voir la feuille de route V1) réordonner cette liste
si besoin — un vrai usage révèle souvent des priorités différentes de celles
prévues à l'avance.
