# Jin'ckets 🎫

App web Vue.js de vente de tickets événementiels — vibe festive, jeunesse, nuit étoilée.

## Stack

- **Vue 3 + TypeScript + Vite**
- **motion-v** (Motion for Vue — API Framer Motion)
- **Pinia** + **Vue Router**
- **Tailwind CSS v4**
- **Lucide** icons
- **Chart.js** (graphe circulaire admin)
- **qrcode** + **jspdf** (QR tickets + factures PDF)

## Démarrage

```bash
cd jinckets
npm install
npm run dev
```

## Comptes démo

| Rôle  | Email               | Mot de passe (n'importe) |
|-------|---------------------|--------------------------|
| Admin | admin@jinckets.com  | *                        |
| Client| client@test.com     | *                        |

## Fonctionnalités

- Preloader animé
- Landing festive (or / violet / nuit étoilée)
- Thème sombre / clair
- Sidebar icônes
- Catalogue événements full-screen slides (spring animations)
- Page tickets par événement + vidéo présentation
- Panier + livraison + commande WhatsApp
- Dashboard client (QR + facture PDF)
- Dashboard admin :
  - KPI + graphe circulaire statuts
  - Gestion tickets (stock, édition)
  - Gestion événements (vidéo)
  - Commandes (statut, PDF, QR)
  - Clients

## Couleurs

- Bleu nuit `#0a1628`
- Noir étoilé `#050510`
- Violet sombre `#2d1b4e`
- Or sombre `#c9a227` / accent `#e8c547`

## Notes

- Les commandes WhatsApp ouvrent `wa.me` avec le message pré-rempli (remplace le numéro dans `stores/cart.ts`).
- Données mockées en mémoire (Pinia) — brancher une API plus tard.
- Favicon / miniature : **J'cK**
