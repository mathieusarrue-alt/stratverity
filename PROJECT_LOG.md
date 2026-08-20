# Journal de projet StratVerity

## 2026-08-20 — Release frontend AWS Amplify

### Release et qualité

- Branche de production : `main`.
- Application AWS Amplify : `StratVerity Frontend Production` (`d1ybxnm394w3bh`, `eu-west-3`).
- Plateforme : `WEB_COMPUTE`, branche `main`, auto-build GitHub activé.
- Commit de release validé avant documentation : `80e62b6`.
- Quality gate local validé : installation verrouillée, lint, tests frontend, build Amplify, test de l'adaptateur SSR et audit npm de production.
- Recette Amplify validée sur `/`, `/configure`, `/robots.txt`, `/sitemap.xml`, `/og.png`, `/marketplace`, `/score`, `/crash-test`, `/health-check`, `/login`, `/contact` et `/legal/terms` ; `/cert` redirige volontairement.
- Anglais par défaut, métadonnée Google Search Console, sitemap, robots et bannière Open Graph vérifiés.
- En-têtes HSTS, CSP, nosniff, anti-framing, Referrer-Policy, Permissions-Policy et COOP configurés dans Amplify.

### Paiement et périmètre produit

- Stripe Live reste configuré pour le Checkpoint Audit à `14,99 EUR HT`.
- Le backend reste l'autorité des montants ; le navigateur ne fournit jamais un prix de confiance.
- La confirmation métier dépend exclusivement des webhooks Stripe signés et idempotents ; aucun produit n'est activé depuis la seule page de retour Checkout.
- Aucun paiement réel n'a été exécuté pendant cette recette de déploiement frontend.
- Les API Crash-Test et Marketplace restent volontairement désactivées jusqu'à leur recette backend dédiée. Les pages frontend peuvent être consultées sans activer ces services.

### Exploitation

- Le guide universel est `docs/DEPLOYMENT_GUIDE.md`.
- Les secrets Stripe, Supabase service-role, AWS et GitHub ne doivent jamais être exposés au frontend ni stockés dans Git.
- L'ancien hébergement doit rester disponible jusqu'à la validation complète du domaine Amplify et de la recette publique.