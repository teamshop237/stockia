# StockIA — Espace admin (staff StockIA) : outils existants et à venir

Ce document liste les outils du backoffice admin (`/admin`, réservé au staff
StockIA, distinct de l'espace client). Comme pour
[stockia-v2-fonctionnalites-futures.md](./stockia-v2-fonctionnalites-futures.md),
rien ici n'est codé au-delà de ce qui est marqué "Fait" — c'est une liste de
propositions triées par priorité, pas un engagement.

---

## Déjà en place

- **Connexion admin séparée** (`/admin/login`) — compte staff, sans
  organisation ni "profile", distinct des comptes clients.
- **Liste de toutes les organisations**, avec recherche par nom — nom, date
  de création, nombre de membres, nombre de produits.
- **Suspendre / réactiver une organisation** — coupe l'accès immédiatement
  (côté base de données, pas juste côté interface).
- **Détail d'une organisation** — nom modifiable, liste de ses membres et de
  ses produits, suppression définitive (avec confirmation).
- **Gérer les autres admins depuis l'interface** (`/admin/admins`) — ajouter
  par email (la personne doit déjà avoir un compte StockIA) ou retirer un
  admin, sans passer par SQL.

---

## Priorité 2 — Renforcent le backoffice sans être vitaux

- **Statut d'abonnement par organisation** (essai / payant / expiré, posé à
  la main tant que le paiement n'est pas automatisé — voir la V2) — permet de
  savoir qui payer sans dépendre de la mémoire ou d'un tableur externe.
- **Historique des actions admin** (qui a suspendu quoi et quand) — dès que
  plusieurs personnes ont accès à l'admin, "qui a fait ça" devient important,
  comme pour l'équipe côté client.
- **Statistiques globales simples** (nombre d'organisations, inscriptions
  cette semaine/ce mois, total de produits gérés sur la plateforme) — vue
  d'ensemble rapide de la croissance, sans avoir à interroger la base à la
  main.
- **Renvoyer une invitation ou un lien de réinitialisation de mot de passe**
  pour un membre bloqué, depuis l'admin — évite de passer par le support
  Supabase directement.

## Priorité 3 — Utile mais non urgent, ou sensible

- **Se connecter "en tant que" un client (impersonation)** pour diagnostiquer
  un bug qu'il décrit mal — puissant mais délicat : ne pas construire sans
  audit log (qui a impersonné qui, quand) et sans que ce soit visible côté
  client.
- **Suivi d'usage IA par organisation** (nombre d'analyses demandées, coût
  approximatif) — utile une fois que le volume de clients rend le coût de
  l'API Claude significatif à surveiller.
- **Actions groupées** (suspendre plusieurs organisations, exporter la liste
  en CSV) — utile seulement à partir d'un nombre significatif de clients.
- **Rôles admin différenciés** (ex. support en lecture seule vs admin complet
  qui peut suspendre/supprimer) — aujourd'hui un admin est admin à 100 % ou
  pas du tout ; à envisager si l'équipe staff grandit.

---

## Suggestion de méthode

Valider dans l'ordre 1 → 2 → 3, en laissant les vrais besoins du support
client (une fois qu'il y a plusieurs organisations actives) réordonner cette
liste si besoin.
