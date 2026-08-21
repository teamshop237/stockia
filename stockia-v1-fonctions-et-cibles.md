# StockIA — Version 1 (utilisable) : fonctions, options et entreprises ciblées

---

## 1. Fonctions et options de la V1

### Compte et accès
- Inscription avec création automatique de l'espace entreprise (organisation)
- Connexion / déconnexion sécurisée
- Chaque entreprise voit uniquement ses propres données (isolation totale)

### Gestion des produits
- Ajouter un produit (nom, référence/SKU, quantité, seuil d'alerte, prix, catégorie)
- Modifier un produit existant
- Supprimer un produit
- Voir la liste complète des produits en stock, avec recherche/filtre simple

### Tableau de bord
- Nombre total de produits en stock
- Valeur totale du stock (quantité × prix, additionné)
- Liste mise en évidence des produits sous leur seuil d'alerte (rupture proche)

### Intelligence artificielle
- Analyse automatique de l'état du stock
- Recommandations en langage clair : quoi réapprovisionner en priorité, et pourquoi
- Rafraîchissable à la demande (bouton "actualiser l'analyse")

### Sécurité et fiabilité
- Données isolées par entreprise (RLS)
- Messages d'erreur clairs en cas de problème
- Indicateurs de chargement pendant les actions

### Ce qui n'est volontairement PAS dans la V1 (à annoncer comme "bientôt disponible")
- Paiement en ligne automatisé (abonnement géré manuellement pour l'instant)
- Plusieurs utilisateurs par entreprise avec droits différents (1 seul compte par entreprise pour l'instant)
- Historique des mouvements de stock (entrées/sorties dans le temps)
- Gestion de dates de péremption
- Statistiques avancées et export de données

---

## 2. Quelles entreprises ont besoin de ce service, et pourquoi

| Type d'entreprise | Ce que la V1 leur apporte déjà |
|---|---|
| Boutique (vêtements, électronique) | Fini les ruptures découvertes trop tard sur les articles populaires |
| Pharmacie / parapharmacie | Alerte avant rupture sur les produits à forte rotation |
| Restaurant | Visibilité claire sur les ingrédients qui manquent bientôt |
| Quincaillerie | Gérer un grand nombre de références sans tableur compliqué |
| Petit supermarché / épicerie | Recommandations IA pour prioriser les commandes fournisseurs |
| Grossiste / petit entrepôt | Vue d'ensemble rapide de l'état du stock, sans logiciel lourd |

**Point commun recherché par toutes ces entreprises :** un outil simple, accessible sans formation technique, qui leur évite de perdre de l'argent (rupture = vente perdue, surstock = argent immobilisé), sans avoir à embaucher quelqu'un pour gérer un logiciel complexe.

**Profil du client idéal pour cette V1 :** une petite ou moyenne entreprise avec un seul gérant qui suit le stock lui-même, actuellement sur papier ou Excel, qui n'a pas encore de logiciel dédié. C'est le client le plus facile à convaincre, car le gain est immédiat et évident dès la démonstration.

---

## 3. Prochaine invite à donner à Claude Code

Le squelette et le cadrage "développeur senior" sont posés. L'étape suivante est le schéma de base de données (le bloc le plus critique), puis l'inscription. Donne ces deux invites, dans l'ordre, en attendant la fin de chacune avant de passer à la suivante :

**Invite 1 (base de données) :**
```
Crée les tables organizations, profiles et products dans Supabase en exécutant le script
SQL fourni dans CLAUDE.md, y compris l'activation et la configuration de Row Level
Security. Une fois fait, explique-moi en 2-3 phrases simples comment l'isolation des
données entre entreprises est garantie techniquement, pour que je puisse le vérifier.
```

**Invite 2 (inscription + création automatique de l'entreprise) :**
```
Crée le flux d'inscription décrit dans CLAUDE.md : l'utilisateur fournit email, mot de
passe et nom d'entreprise. À l'inscription, crée automatiquement l'organisation puis le
profil lié, dans une seule opération cohérente (si une étape échoue, aucune des trois ne
doit rester à moitié créée). Ajoute aussi la page de connexion avec redirection selon
l'état de connexion.
```

Une fois ces deux étapes validées (teste avec 2 fausses entreprises différentes pour confirmer l'isolation), tu peux enchaîner directement avec l'invite 3 du CLAUDE.md (gestion des produits).
