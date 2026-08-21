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
- Le domaine Amplify est `AVAILABLE`; l'état DNS antérieur est sauvegardé localement pour un rollback contrôlé.
### Mise en production publique

- Commit déployé : `0fdc4411ec3e86aab21f343835d177286fc8c4fc` ; job Amplify `15`, étapes BUILD, DEPLOY et VERIFY réussies.
- `stratverity.com` et `www.stratverity.com` servent désormais le frontend via AWS Amplify/CloudFront avec certificat géré par AWS.
- Recette publique validée : routes produit et SEO en HTTP 200, `/cert` en redirection 307 attendue, canonical et OG sur `www.stratverity.com`, en-têtes de sécurité présents.
- Recette commerciale non payante validée : preview Audit BASE à un contexte, création d'une session Stripe `cs_live_*`, URL exclusivement `checkout.stripe.com`, aucun débit exécuté.
- Le projet Supabase configuré a été restauré après détection de son état inactif. L'authentification e-mail est activée.
- Google, GitHub et Microsoft restent désactivés dans Supabase tant que leurs identifiants OAuth propres ne sont pas fournis ; l'interface les rend volontairement non cliquables dans cet état.

## 2026-08-21 — Release 0.28.0 préparée

- Phases Free Tools, Crash-Test et Marketplace consolidées derrière des flags
  indépendants et fail-closed.
- Health-Check : parcours e-mail vérifié et quota serveur prêt, sans activation
  avant la recette SES production.
- Crash-Test : code brut non conservé, Checkout signé rapproché et rapport
  publié après webhook uniquement ; activation différée jusqu'à la recette.
- Marketplace : identité Supabase revalidée côté backend, propriété et
  consentement append-only, Stripe Connect, commission uniforme 15 %, artefact
  exact et téléchargement temporaire à usage unique.
- UI publique premium et espace vendeur authentifié ajoutés ; aucun faux produit
  n'est présenté quand la Marketplace est fermée.
- Quality gate local : lint, build et 24 tests frontend réussis ; 314 tests
  backend réussis sous Python 3.12.
- Le déploiement doit conserver les trois nouveaux produits désactivés jusqu'aux
  portes SES, Stripe dédié, Connect/KYC et validation juridique documentées.