# Frontend — reprise publique et qualification locale

Correction texte post-raccord relue indépendamment : le panneau couverture
précise maintenant que la couverture SEULE n'autorise aucun paiement, plutôt
que nier la possibilité d'un checkout distinct après devis réservé. Prix,
consentements, états, flags et permissions inchangés.

Rejeu indépendant principal sur sources finales : npmtest86PASS, typesDOM/Worker
etbuildPASS ; JUnit private_audit_ui_global_principal_20261122.xml.
Navigateur complet rejoué par principal, résultat PASS et capture réellement
ouverte : evidence/private_audit_ui_browser_20261122T155834Z/. Reprise exacte,
query doublon, ABA déféré et8places avant acquisition confirmés, zéro pageerror.
Recette HTTP/consumer/Docker distincte dans backendbranche
codex/private-http-docker-rehearsal-20261122 ; aucune activation native déduite.

## 22 novembre — raccord UI privé DEV construit et qualifié localement, OFF hors recette

ADAPTER le noyau local et les composants existants, sans nouvelle dépendance.
Plan 1–6 relu par principal avant code : composant checkout isolé, garde
révision ET payload aux frontières asynchrones, reprise explicite des anciennes
tentatives initiées après reload, retour dédié statut seul. Contrat existant
CHECKOUT_CONTRACT conservé à l'identique ; jamais de token/source/email dans
le cache. Ni prix local, calcul moteur, chemin legacy ou production modifiés.
Flags dev/loopback existants et opt-in checkout restent OFF hors recette.
La recherche ReactuseEffect/Auth/Supabase de la session principale est réutilisée ;
Hermes install.lock toujours bloqué, délégation GPT puis revue indépendante.
Branche `codex/private-audit-ui-wiring-20261122`, parent579775d.
Le configurateur conserve maintenant devis/scope/révision/tentative/clé figés,
présente le contrat EXISTANT et passe au transport checkout privé sans emprunter
le chemin legacy. Toute sélection effective invalide le devis et le consentement,
y compris A→B→A pendant une requête. Les tentatives initiées restent récupérables
explicitement après reload (même devis/clé/contrat), même si la réponse HTTP a
été perdue. La version du contrat est figée pour ce bloc DEV ; un changement
de version exige réconciliation serveur, pas une nouvelle clé automatique.

Préflight lecture/écriture sur le namespace AVANT source/freeze ; stockage
corrompu/bloqué/silencieusement non inscriptible ou8tentatives refuse une
nouvelle préparation sans éviction. Une reprise existante reste possible.
Premier devis expiré : bouton désactivé ; tentative déjà initiée : reprise
permise localement mais autorité TTL/idempotence exclusivement serveur.
L'indicateur initiated ne prouve ni réception serveur ni paiement.

`/configure/private-success` ne fait QUE le statut privé : query unique,
contexte sessionStorage strict, flags dev+127, garde query SPA/fragment et
cleanup/unmount. Pas de HTML/email/source/download/owner_token/Stripe polling.
Noindex + no-referrer,24polls max et20s/requête (noyau déjà qualifié).
Report prêt ne signifie pas email reçu. Une session connue offre aussi un
lien de statut sans devoir relancer checkout. Aucun flag, API réelle,
paiement, compte, email, production ou fournisseur n'est activé ici.

Qualification : `npm test` **86/86 PASS**, DOM+Worker0diagnostic et buildPASS.
JUnit durable `evidence/private_audit_ui_global_qualified_20261122.xml`.
8tests UI transpilent les TSX réellement modifiés (consentement, busyref,
stale/unmount, expiry/reprise, session connue, OFF, query SPA) ;12tests noyau
incluent stockage et préflight. Ce ne sont pas des parités de paiement.

Navigateur Chrome réel + Playwright existant, ENV enfant allowlistée et
`envDir` Vite VIDE : recette uniquement fixtures Auth/API, aucune donnée
personnelle/cookie réel ni lecture de `.env`. Blocage de tout non-loopback
AVANT navigation ; l'URL Stripe est refusée, jamais chargée. Preuve finale
`evidence/private_audit_ui_browser_20261122T155630Z/result.json` et
`private-return.png` : prix19€ affiché avant fetch, source→freeze→quote,
checkout réponse perdue→reload→reprise EXACTE body+clé, retour statut,
query doublon sans appel, vraie réponse freeze différée après A→B→A refusée,
stockage8pending refusé avant upload sans éviction. Zéro exception navigateur
signalée sur le parcours principal. La recette HTTP/composition/Docker est
séparée et conduite par le principal ; cette preuve UI ne l'anticipe pas.

Échecs conservés : harnais TSX initial récursif corrigé (pas moteur),
harnais CSS CommonJS après cosmétique (global_final :84PASS/2FAIL), corrigé
par mock export default conforme puis global_qualified :86PASS,
navigateur155237 sonde readinessGET405 (route POST inchangée),155319 mock
NOT_READY/report_ready incohérent correctement rejeté,155513 état submitting
resté bloqué après rejet stale. Ce dernier vrai défaut UI est corrigé par
reset idle dans l'invalidation privée et rejoué au navigateur155630.
Anciennes sections « UI NON raccordée » ci-dessous sont HISTORIQUES.

## 22 novembre — noyau transaction locale/retour, UI NON raccordée

Branche `codex/private-audit-ui-return-20261122`, parent1934556. Plan relu :
ADAPTER le transport existant dans un petit module pur, sans dépendance.
Le périmètre effectivement construit ici est SEULEMENT
`app/configure/private-audit-flow.ts`, ses tests et leur inscription npm.
Aucun changement de page/configurateur, aucune page private-success créée,
aucun bouton/flag/paiement/serveur activé : le reste du plan UI est EN ATTENTE.

Métadonnées seules : scope Audit mono-contexte exact (SHA/version, jamais le
fichier/nom/source/email/token), devis, révision, tentative et clé immuables.
Un namespace sessionStorage est borné à64KiBUTF8 et8TENTATIVES au total,
sans éviction/remplacement de tentative pour faire de la place. Transition
initiated persistée avant dispatch ; storage impossible ou première expiration
refusent avant fetch. Réessai conserve devis/clé d'origine. Ce marqueur client
ne prouve pas un envoi ni une autorité de paiement côté serveur.

Retour parsé strictement : un attempt et un session_id, aucun autre champ ;
contexte local initié requis, session locale différente refusée. Le poller
appelle UNIQUEMENT statusPrivateAudit, au maximum24fois, intervalle2.5s,
timeout20s/requête, annulation et garde stale avant/après réponse/callback.
Correction relevée en revue : stop() depuis onStatus doit terminer avant
d'attendre un nouvel intervalle ; cas testé. Reportready n'est pas emailreçu.

**11 nouveaux tests verts**, deux typechecksDOM/Worker sans diagnostic et
buildréussi ; rejoueglobal **77testsverts**, dontles66précédents, nonadditionnables.
Preuves `evidence/private_audit_flow_final_qualified_20261122.xml` (11) et
`evidence/private_audit_flow_global_20261122.xml` (77). PremièrecollecteNode
échouait surimportTSextensionless avant exécution des cas ; tracesinitiales
conservées. Teststranspilent la VRAIsource viaTypeScript installé, avecseul
import du helper changé en URLfichier .ts pourNode ; pas de copie métier ni
assouplissement tsconfig. Les testsutilisent stockage/fetchdoubles, pasbrowser,
Supabase/Stripe/emailréels. Les shellsFR/EN et leur raccord UI restent à coder
et à qualifier, ne pas déduire parcoursclientterminé de ce noyau testé.

Revue indépendante finale par l'agent principal : source et scopebuilder relus,
`npm test`77/77+typesDOM/Worker0+buildPASS reproduits. Preuve distincte
`evidence/private_audit_flow_global_principal_20261122.xml`,77casverts.

Rejeu indépendant final par l'agent principal après durcissement URL :
`npm test` PASS (types DOM/Worker0, build,66tests), puis JUnit durable
`evidence/private_checkout_transport_global_final_20261122.xml` 66/66.
ClientSHA8539AA759B0229E69322FF8CD809BB7F3CFDB282587A9F9813AED81D5EEF692C,
bridgeSHAB288E7DDF1540D92FB489FDC9388F74A53992C1648CD83A9EF93FEEA5710F4E9.
Ces tests ne raccordent PAS encore les pagesUI/retour et n'activent aucun flag.

## 22 novembre — transport privé checkout/statut, contrat avant code

Décision ADAPTER le client et le proxy loopback existants, sans nouvelle
dépendance ni SDK/provider. Pré-scan client/bridge/configurateur/retour/tests,
plan relu par l'agent principal avant ce bloc. Recherche de la session backend
réutilisée (docs Auth/Supabase/Stripe), pas de recherche externe supplémentaire.
Hermes indisponible install.lock confirmé par le principal ; délégation GPT.

Le bloc TRANSPORT reçoit checkout/statut derrière un second opt-in booléen,
OFF par défaut et développement/loopback obligatoires. Le Bearer ne vient que
du serveur. Idempotency-Key ASCII unique n'est transmis que pour checkout.
201 seulement pour checkout, 200 pour les autres opérations ; projections
explicites/no-store et aucune redirection HTTP suivie automatiquement.
Le devis validé retourné par reserveLocalAudit devient immutable. Les helpers
valident prix/scope/quote/IDs/URL, sans devenir une autorité de paiement.
Une option locale allowExpiredRetry explicite conserve le même devis/clé pour
un réessai initié ; elle ne contourne jamais le TTL imposé par le backend.

Aucun changement page/configurateur/success, UI/redirect automatique, owner_token,
activation de production, données, moteur ou exécution client. Le retour legacy
reste incompatible avec l'identité privée ; ne pas brancher un bouton avant sa
qualification séparée. Les fragments opaques Stripe sont conservés sans
interprétation ni retrait : l'exemple officiel Checkout utilise `#fidkd...`.
Cela n'autorise jamais un autre hôte, des credentials ou un autre port.

Implémentation du transport sur `codex/private-checkout-transport-20261122` :
nouvelle variable serveur `STRATVERITY_PRIVATE_AUDIT_CHECKOUT_LOCAL` lue mais
jamais activée par ce bloc ; elle exige aussi NODE_ENV=development, l'ancien
opt-in privé et deux origines loopback distinctes. Checkout POST201/statut
POST200, token de cookie uniquement ; en-tête de clé ignoré sur statut et
doublons fusionnés avec virgule refusés sur checkout. Réponses de paiement
projetées sans lignes de cible historique, identité propriétaire ou champs
privés imbriqués ; aucun Location/Set-Cookie retransmis. Le fragment Stripe
opaque est retourné identique, aucune navigation automatique par ces helpers.
Source officielle consultée côté agent principal :
https://docs.stripe.com/api/checkout/sessions/object

`npm test` réussi : types DOM/Worker sans diagnostic, build vinext réussi,
**66tests verts** (54 précédents +12 nouveaux). Groupe client/bridge19verts ;
comptes chevauchants. JUnit `evidence/private_checkout_transport_20261122.xml`
rejoué après build. Warnings préexistants ViteconfigLoader et chunks>500kB,
pas de mise à jour de paquet. Prix local instantané inchangé, aucun fetch de
prix nouveau ni modification page/success, aucune activation ou livraison.
Les réponses réseau sont des doubles de test, pas un vrai checkout Stripe ni
une connexion Supabase distante. Le helper `allowExpiredRetry:true` conserve
devis et clé fournis, mais ne prouve pas qu'une tentative a effectivement été
initiée : le backend vérifie encore propriétaire, session et TTL applicable.
Les pages restent volontairement non raccordées tant que leur retour privé et
la provenance du destinataire serveur ne sont pas qualifiés séparément.

Durcissement URL après revue indépendante : l'autorité BRUTE doit aussi être
ASCII DNS (pas de conversion IDN/percent-host par URL()), sans port vide final,
avec labels DNS1..63caractères et tirets seulement internes. Refus explicites
`checkout.stripe.com:`, `.stripe.com`, `-bad.stripe.com`, labels vides et hôtes
Unicode/percent-encodés ; port443 et query/fragmentopaques conservés identiques.
Les deux validateurs ont les mêmes fixtures. Après correction : groupe19tests
verts, typechecksDOM/Worker0diagnostic etbuildréussi ; preuve additionnelle
`evidence/private_checkout_transport_focus_final_20261122.xml`. La preuve66
initiale reste intacte, le principal reproduira la suite complète finale.

## 21 novembre : unité du drawdown de la démo corrigée

Bloc séparé après53d6fef, plan relu avantcode. Le graphique soustrayait deux
rendements cumulés en% du capital initial, soit des POINTS, puis appelait ce
tracé « unrealized drawdown ». Correction : E=100+rendement, picinitial=100,
DD=100×(E/pic−1). Cas100→120→110 :−8.333333%, pas−10points ; perteinitiale
immédiate désormais prise en compte. Aucun clamp de perte à−100 ni prix inventé.
Réemploi des principes du module backend metrics/equity_curve.py ; pas de
nouveau moteur ni dépendance. La légende précise échantillons affichés,
capitalinitial inclus, pas de reconstruction intrabougieMTM et pas de
substitution au MaxDD original du rapport. Seed et métriques scellées INCHANGÉS.

Baseline depuisparent :1échec/4verts, preuve
`evidence/drawdown_units_baseline_20261121.xml`. Final `npm test` : typesDOMet
Workerzérodiagnostic, build réussi, **54tests verts**, preuve
`evidence/drawdown_units_final_20261121.xml`. Cinq tests reproduits indépendamment,
oracles0→20→10, pertesinitiales, plat, doublementpuisretourinitial. Pas de
recettevisuelle navigateur, modificationPython/Pine/MQL ni déploiement.

## 21 novembre : qualification des types et API graphiques

Branche séparée `codex/frontend-type-runtime-20261121`, après le lot capacité.
Les13diagnostics antérieurs sont corrigés : ErrorBoundary réutilise ErrorInfo
React (componentStack nullable), filtreSet typé explicitement, altMarketplace
n'accepte qu'une string ; aucun changement de catalogue, prix ou droits.
Deux premières corrections produisent du JavaScript strictement identique,
comparé par la revue indépendante. Graphiques : optionslayout/timeScale et
AreaSeries de lightweight-charts v5, remove() effectif au démontage, nettoyage
d'un chart créé partiellement et fitContent(). Valeurs de courbes inchangées.

**`npm run typecheck` passe pour DOM ET Worker, zéro diagnostic.** Les types
Cloudflare ont été générés LOCALEMENT par Wrangler4.122.0/workerd1.20260811.1,
compatibility_date2026-08-12/nodejs_compat (mêmes paramètres que le build).
Fichier573174octets, SHA A310E4F72EEDDF95C4E04A388F5E5AF2599F10099B7A578C0D5D4997341BC951.
En-têteslicenceApache2/Microsoft/Cloudflare conservés. Pas de paquet ajouté,
pas deconfig compte/secret/binding. Script `gpt_generate_worker_types.mjs`
assainit env et utilise un nouveau dossierlocal ; refuse tout écrasement.
Le script est un générateur initial : surclonecontenantdéjàle.d.ts, le refus
est attendu, pas un besoin de régénérer pour lancer les tests.

L'inclusion de ces types dans DOM provoquait des collisions Element/Response ;
deuxprojets stricts les séparent. Worker/db/exemplesD1/tousles.d.ts sont contrôlés
côtéWorker, pas cachés : test de partition vérifie que TOUTES les sources
initiales sont couvertes par l'union. `DB?` reste optionnelle et getDb refuse
son absence ; cela ne prouve pas qu'un bindingD1 est déployé.
skipLibCheck préexistant conservé, ni any ni @ts-ignore ni strict:false ajoutés.

`npm test` inclut maintenant types+build+**53tests**, au lieu des seuls28HTML.
Preuve `evidence/frontend_types_runtime_final_20261121.xml` ; baselinegraphique
surparent0b5d896 :3échecs/1vert, `chart_v5_baseline_20261121.xml`.
Revue indépendante : deuxprojets typecheck et4tests graphiques/partition
reproduits. Ce sont doublesAPI/SSR, PAS une validation visuelle navigateur.
Warnings ViteconfigLoader futur etchunks>500k conservés, pas de miseàjourpaquet
ou de déploiement. Aucun moteur Python/Pine/MQL ni résultat trading changé.

Sources consultées / décision ADAPTER : types locaux installés React et
lightweight-charts5.2.1 ; documentation officielle migrationv5 et génération
Wrangler (https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5,
https://developers.cloudflare.com/workers/languages/typescript/).
GitHub/X/Reddit limitations de session déjà consignées ; pas de code externe
hors déclarations officielles générées. Rollback : brancheparent, pas de DB migrée.

## 21 novembre : capacité avant paiement, identité fournisseur explicite

Branche de revue `codex/audit-capacity-prepayment-20261121`. Devis local toujours
instantané et prix inchangés. PourAUDIT, dixcryptos ducatalogue sont reliées
EXPLICITEMENT àleur identitéSpotBinance ; aucune heuristique suffixeUSDT,
aucun changement de scopeSCAN/OPTIMIZER. Le même mapper construit scopeetguard.
Bornes calendaires365..366jours/an sans réseau niDate.now : dépassementcertain
100kbarres, fournisseur nonqualifié oumulticontexte bloquent le nouveaupaiement
avec messageFR/EN, sans tronquerl'historique. Comptefits n'est PAS donnéequalifiée.
Le serveur recontrôle dans latransaction etprotège aussilesréservationslegacy
sansStripe ; sessionsStripe déjàattachées préservéesaprèscontrôlesidentité.

Buildvinext réussi et **49tests verts** (28HTML+21couverture/privé), preuve
`evidence/audit_capacity_front_final_20261121.xml`. Revue indépendante45tests
reproduits. Le guardcheckout examinelepayloadcapturé avantemail/upload/fetch ;
bouton disabled seuln'estpaslecontrôleserveur. PrivateLocal resteBTC/ETH
uniquement, conversionidempotente, pasnouveaupoolmarché. Aucun clicbrowserréel
ou compte/paiementréel qualifié danscebloc. Sources/docs copiéescanoniquement
aprèscontrôleshash, aucunmainmodifié ou déploiement.

Contrôle additionnel `node node_modules/typescript/bin/tsc --noEmit --incremental false` :
**13diagnostics**, identiquesauparent563d28. ComparaisonviaTypeScriptCompilerHost
readFileoverlayenmémoire des3sourceschangées depuisgitHEAD, sanscheckoutécrasant.
Fichiers : I18nErrorBoundary, market-catalog, ExampleCharts, layout, marketplace,
db, worker. Buildtranspilevert n'est PAS typesglobauxverts ; prochainbloc séparé.
Voir `evidence/audit_capacity_types_baseline_20261121.json`.

## Complément du 21 novembre : cohérence de couverture

Branche de revue `codex/coverage-projection-calendar-20261121` : correction du
parser de fenêtre privée et de sa cible de palier. L'interface refuse les faux
historiques complets, grillesH4/W1 décalées, fractions sousmilliseconde et
fenêtres au-delà de20ans. Années calendaires/leapday, fournisseur explicite et
depth du scope contrôlés. Le prix est toujours calculé localement, sans nouveau
réseau/délai, aucun tarif ni paiement modifié.

Buildvinext réussi ; **44tests verts** (28HTML+16privé/couverture), preuve
`evidence/coverage_projection_front_20261121.xml`. Tests positifsH4/W1/années
bissextiles et cataloguecommun2/8/10ans. Fixture de catalogue
`tests/fixtures/audit_history_catalogue.json`, SHA
9f1fd578eadab5197f0861cadccdde9af85291ed8d453be2bfe252b09db066af,
identique à celle du backend. Guide détaillé dans le backend :
`backend/docs/COVERAGE_PROJECTION_CONSISTENCY.md` sur la branche de même nom.
Pas de nouvelle recette navigateur, d'activation production ou de couverture
marché supplémentaire déduite du succès logiciel. La qualification du20nov
ci-dessous reste historique ; le présent complément la prolonge.

Branche `codex/frontend-qualification-20261120`, au-dessus de
`codex/private-audit-rehearsal-20261111`. Aucun changement de code produit,
déploiement, paiement ou commande réelle par ce lot.

Le 20/11/2026, comparaison normalisée des sources `app`, `components`,
`lib`, `tests` (.ts/.tsx/.mjs/.css) entre chantier canonique et copie de
revue : **zéro différence**. Cela ne concerne pas les ZIP, scripts privés,
captures, packs graphiques ou fichiers de build locaux, volontairement non
publiés en masse. Aucun secret ni source utilisateur ajouté.

## Preuves reproduites

- `npm test` : build vinext réussi, **28 tests de rendu réussis**.
- Suites couverture, client Audit privé et passerelle : **12 tests réussis**.
- Rejeu des quatre suites après build : **40 tests réussis**,
  [JUnit](evidence/frontend_public_20261120.xml).

Environnement : Node24.18.0, dépendances existantes du lockfile. Les
avertissements Vite sur futur chargeur natif et taille de chunk ne sont pas
des échecs de build. Pas de mise à jour de dépendance ou d'infrastructure.

```text
npm test
node --test tests/audit-coverage.test.mjs tests/private-audit-client.test.mjs tests/private-audit-bridge.test.mjs
```

Les tests vérifient notamment le prix local instantané, les gardes de
couverture et le refus du parcours privé en bundle production. Ce n'est pas
une recette navigateur avec compte/paiement réel ; la dernière preuve
navigateur distincte reste datée du11novembre. Aucune couverture marché
actuelle ou disponibilité universelle20ans affirmée.

Le backend est publié en branches de revue distinctes dans
[stratverity-audit-backend](https://github.com/mathieusarrue-alt/stratverity-audit-backend).
Lire son README sur la dernière branche de qualification et chaque guide
de périmètre avant fusion. Les branches sont empilées, pas des déploiements.
Main reste inchangé pour ne pas déclencher automatiquement l'hébergement.
