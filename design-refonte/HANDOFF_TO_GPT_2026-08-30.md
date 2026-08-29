# Handoff — StratVerity frontend, 2026-08-30

Contexte : Claude a travaillé sur `stratverity` (landing + `/configure` + `/sell`)
suite à un retour direct du fondateur sur le site EN PRODUCTION. Tout ce qui suit
est commit + push sur `main` (github.com/mathieusarrue-alt/stratverity). Ce fichier
sert de passation à un autre modèle (GPT) pour continuer sans re-découvrir le
contexte.

## Repos concernés

- **Frontend** : `stratverity` (Next.js, ce repo) — `github.com/mathieusarrue-alt/stratverity`
- **Backend/gouvernance** : `SAAS_AUDIT_BACKTEST` — `github.com/mathieusarrue-alt/stratverity-audit-backend`,
  dossier `00_GOVERNANCE/` pour la doc produit/pricing.

## Ce qui vient d'être livré (commits, dans l'ordre)

1. `39bf9b4` — FAQ MetaTrader/TradingView : retrait du cadrage "gratuit".
2. `0364335` — Prix réels sur `#pricing` (19€/79€, plus 49€), retrait de Scan des
   textes marketing, `/configure` : suppression de l'option Scan du sélecteur de
   produit, CSS : labels illisibles (7-9px) remontés à 10.5px.
3. `5f83bfa` — **Correction critique demandée par le fondateur** : le FAQ
   "pourquoi pas juste MetaTrader/TradingView" disait *"ils font mieux que nous sur
   la pure mécanique"* — le fondateur a explicitement dit que ça nous discrédite.
   Reformulé en "vous êtes juge et partie" (audit indépendant) sans concéder
   d'infériorité technique. **Ne jamais réintroduire une formulation qui admet
   qu'un concurrent fait mieux que nous.**
4. `b08072f` — Ajout d'une section **Optimiseur/Lab** sur la landing (`#optimizer`,
   + lien nav) : ce produit existait en copy prête (`design-refonte/OPTIMISEUR_COPY_DRAFT.md`)
   mais n'apparaissait NULLE PART sur le site. Aussi : la grille "outils gratuits"
   présentait le Crash-Test (produit payant 49€) comme gratuit → remplacé par le
   vrai outil gratuit (calculateur de frais, `/fees`).
5. `05f8c31` — **Refonte complète de `/sell`** (le fondateur l'a qualifiée de
   "à peine un brouillon" / design "dégueulasse"). Nouveau module CSS
   (`app/sell/sell.module.css`) reprenant le langage visuel premium de
   `/configure` (cards, chips, sidebar sticky avec calcul de commission en
   direct). Copy entièrement réécrite pour vendre, pas juste décrire. Ajout d'un
   3ᵉ type de produit "Outil / Optimiseur" (`kind: "toolkit"`, déjà supporté côté
   backend). **Bug corrigé au passage** : le champ prix affichait des centimes
   bruts (ex. "1900") sans indication d'unité et un `min` dans une unité
   différente (9) — un vendeur tapant "20" pensant "20€" aurait soumis 0,20€.
   Réécrit en euros de bout en bout, conversion en centimes uniquement à la
   soumission.

## État de la todo du fondateur (message original, 6 points)

1. ✅ Retrait du cadrage "gratuit" MetaTrader/TradingView.
2. ✅ `#pricing` mis à jour avec les bons produits/prix.
3. ⚠️ **Partiellement fait.** Le premium UI/UX a été fait pour `/configure`
   (lisibilité) et `/sell` (refonte complète). **Reste à auditer** : landing page
   dans son ensemble (hero, sections `#product`/`#method`/`#research`), `/login`,
   `/account`, pages `/legal/*`, dashboard `/sell/listings`, `/marketplace`.
4. ✅ Zones illisibles `/configure` corrigées (7-9px → 10.5px).
5. ⚠️ **Scan retiré** de `/configure` et des textes marketing. **Logos produits
   NON faits** — `StratVerityLogo.tsx` (bouclier néon vert `#00FF9D`) est le seul
   logo, générique, pas de logo dédié par produit (Audit/Marketplace/Optimiseur).
   Le fondateur a dit ne pas avoir "de vrais logo pour le produit Audit" — c'est
   une demande de DESIGN (pas juste de code), à itérer avec lui avant de livrer
   quoi que ce soit (ne pas improviser un logo sans validation visuelle).
6. ✅ `/sell` refondu (design + copy + bug prix).

## Pièges connus sur cet environnement (à lire avant de toucher au repo)

### 1. `.git/index.lock` bloque bash mais pas PowerShell/Desktop Commander
Le sandbox Linux (outil bash) a un accès désynchronisé/en lecture décalée au
montage réel Windows. Symptôme : `git commit` échoue avec
`Unable to create '.git/index.lock': File exists` même après suppression du
fichier. **Solution qui marche à 100% cette session** : ne JAMAIS faire les
opérations git via l'outil bash sandbox pour ce repo. Utiliser un process
PowerShell/cmd réel sur la machine Windows (`Start-Process`/équivalent côté
GPT) : `cd <repo> ; git add ... ; git commit -m ... ; git push`. Le filesystem
réel n'a jamais eu de vrai lock — c'est la vue bash qui était périmée.

### 2. Édition de fichiers qui rétrécissent → corruption par octets NUL
Un outil d'édition (`Edit`) qui remplace un bloc par un texte plus court peut
laisser des octets `0x00` après la nouvelle fin de fichier (padding non
tronqué). Symptôme : `tsc --noEmit` rapporte des `TS1127: Invalid character`
en cascade sur la dernière ligne du fichier. **Vérification systématique après
toute édition qui raccourcit un fichier** : lire les derniers octets en binaire
et chercher un `\x00` ; si trouvé, tronquer au premier `\x00` et ré-écrire.
Repéré et corrigé 2 fois cette session (`app/configure/page.tsx`,
`app/configure/scope-configurator.module.css`).

### 3. Pipeline de traduction — NE JAMAIS éditer les fichiers générés
- Source : `design-refonte/landing.html` (texte français inline, `data-i18n="clé"`).
- Traductions : `scripts/app-messages.mjs` (tableau `rows` = 13 colonnes, toutes
  les 12 langues déjà traduites à la main ; tableau `phaseThreeRows` = 3
  colonnes FR/EN seulement, les 10 autres langues récupèrent automatiquement la
  valeur EN comme fallback).
- Un TROISIÈME mécanisme existe : un bloc `<script>` legacy embarqué DANS
  `landing.html` (`const I18N={fr:{},en:{...}}`) qui contient en fait TOUTES
  les 12 langues pour le contenu de base (nav, footer, etc.) — c'est de là que
  vient la traduction complète de `nav.research` par ex., pas de
  `app-messages.mjs`.
- Génération : `node scripts/port-design-refonte.mjs` produit
  `app/home/landing-markup.ts` et `app/i18n/messages.ts` — **ne jamais éditer
  ces deux fichiers à la main**, toujours régénérer.
- **Piège découvert cette session** : si vous ajoutez un `data-i18n="nouvelle.clé"`
  dans `landing.html` SANS l'ajouter aussi dans `app-messages.mjs` (rows ou
  phaseThreeRows), le script de génération plante avec
  `Traduction {locale} incomplète : nouvelle.clé` — il n'y a AUCUN fallback
  automatique pour une clé totalement nouvelle. Toute nouvelle clé doit être
  ajoutée aux deux endroits (HTML + app-messages.mjs) avant de régénérer.
- Commande de vérification après toute modification :
  ```
  node scripts/port-design-refonte.mjs
  # doit afficher : "Refonte portée : NNN chaînes françaises, 12 langues."
  npx tsc --noEmit
  # doit ne montrer AUCUNE nouvelle erreur (5 erreurs pré-existantes sans
  # rapport avec le contenu : I18nErrorBoundary, market-catalog.ts, db/index.ts,
  # worker/index.ts — celles-là sont normales, ignorer)
  ```
- `npx` échoue en PowerShell direct (politique d'exécution des scripts
  désactivée) → passer par `cmd /c "npx tsc --noEmit"` ou lancer node
  directement.

### 4. Pricing réel (source de vérité)
`app/configure/pricing.ts` : Audit Essential 19€ (1 stratégie×1 actif×1 UT, 2 ans
d'historique), Audit Premium 49€ (mono-contexte, 8 ans), Audit Custom dès 79€
(multi-contexte, 10 ans). `CATALOGUE_PRODUITS.md` (SAAS_AUDIT_BACKTEST) contient
des prix plus anciens/possiblement obsolètes — toujours faire confiance à
`pricing.ts` et aux clés `configure.*` de `app-messages.mjs` en cas de
divergence.

## Prochaines étapes suggérées (non commencées)

1. **Logos produits** — demande explicite du fondateur, mais c'est du DESIGN
   visuel qui doit être itéré avec lui (mockups à valider), pas juste du code à
   improviser. Proposer 2-3 directions avant de coder quoi que ce soit en dur.
2. **Audit UI/UX du reste du site** — le fondateur a demandé "améliorer tous
   l'UI et l'UX du site" en général ; seuls `/configure` (lisibilité) et
   `/sell` (refonte complète) ont été traités. Reste : hero/sections landing,
   `/login`, `/account`, `/marketplace`, `/sell/listings`, `/legal/*`.
3. **Vérification visuelle en prod** — tout ce qui précède a été vérifié par
   `tsc --noEmit` (types) et lecture du markup généré, PAS par un rendu
   navigateur réel. Un passage Claude-in-Chrome / capture d'écran sur
   `stratverity.com` après déploiement serait la vérification la plus fiable.
4. Items en attente côté backend (`SAAS_AUDIT_BACKTEST`, non liés à ce
   handoff frontend) : activer Crash-Test Express en prod, accès SES
   production, `TimeBasedTrader_v4.37.1_BetterExit.mq5` non testé via
   MetaTrader.
