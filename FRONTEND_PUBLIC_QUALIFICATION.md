# Frontend — reprise publique et qualification locale

## 24 novembre — phase3 question publication/revente uniquement,107testsPASS

Branche `codex/source-handling-question-20261124` depuis `eb773c1`. Décision
**ADAPTER** une ambiguïté résiduelle relue : l'ancienne question « partagé ou
stocké ? » suivie de « Non » pouvait nier la conservation pourtant expliquée
par FAQa8. Douze questions FAQq1 sont maintenant limitées à la publication et
à la revente ; les termes localisés sont repris des réponses existantes.
FR : « Votre code est-il publié ou revendu ? » ; EN : « Is my strategy code
published or resold? ». Fallback anglais du bootstrap landing aligné.

Périmètre exact : **12 clés faq.q1 + un fallback**. Toutes les réponses FAQa1
restent inchangées, comme FAQa8 (copie privée possible, modalités de conservation
à préciser), les 36 textes de phase2, legal.*, le contrat et la page checkout.
Aucune nouvelle promesse sur stockage/suppression/droits, aucune durée ni
politique juridique ajoutée. API, moteurs, données, paiements, flags de production
et Marketplace inchangés. Générateur du design non relancé.

Preuves neuves : `evidence/source_handling_question_before_20261124.json` et
`source_handling_question_after_20261124.json`, contenant les 12 couples old/new
et les empreintes de garde. Deux tests dédiés vérifient les 12 questions,
l'absence de question de stockage, le fallback EN et les réponses/disclosures
inchangées. Les gardes legal/contrat existantes restent actives.

Baseline réelle AVANT changement de copie : **1 échec / 1 succès**, fichier
`source_handling_question_baseline_20261124.xml` conservé. Après adaptation :
**8 ciblés PASS**, types DOM/Worker PASS, build PASS puis **107 tests PASS**
dans `source_handling_question_qualified_20261124.xml` (mêmes huit fichiers de
tests que npm test). Commandes exécutées séparément : npm run typecheck,
npm run build, node --test avec sortie JUnit. Aucun navigateur ou fournisseur
réel lancé ; pas de déploiement, commit ou push par l'auteur avant revue.

Empreintes de garde stables : FAQa1 `97a46b66…da6bb6c`, FAQa8
`2a50facd…bb69d9`, trois disclosures de phase2 `b16ba796…5d2de27`,
legal.* `926ec3fd…446e856`, page checkout `7e05fe92…0319c7`,
contrat `a5090ef8…939de5`. Cette correction sémantique ne qualifie ni
l'effacement technique ni une politique internationale de confidentialité.

Revue principal du diff des douze questions et des empreintes : conforme.
Rejeu principal107/107PASS, preuve
`evidence/source_handling_question_principal_20261124.xml` ; aucun ancien
résultat ou texte de réponse remplacé pour faire passer les contrôles.

## 24 novembre — phase2 communications free/health/exemple/FAQ alignées,105testsPASS

Branche codex/source-handling-all-surfaces-20261124 depuis6019dc4 (phase1
publiée et102tests historiques conservés). Plan relu avant code ; préflight
communication trading et recherche primaire CNIL transparence/conservation
France/UE de la session précédente réutilisés. **ADAPTER** les copies, sans
nouvelle règle juridique/contrat ni durée inventée. Verdict factuel REVISE,
pas READY juridique ou lancement international/pub payante autorisé.

Périmètre exact :36messages(12locales×ft.lead/ft.healthBody/health.privacy),
deuxfallbackslanding, noteinlinehealth réutilisanthealth.privacy, deuxclaims
exemplepayé avec lienFAQ, une réponseFAQdatasetEN. FR+fallbacksENexistants
uniquement, pas de traduction supplémentaire improvisée. FreeHealth reste
statique SANS exécution de stratégie ni ordre réel ; fichiers temporaires
possibles selonformat et empreintes/résultats susceptibles d'être conservés.
Exemplepayé distingue statique OU exécution isolée selonprofil, copie privée
possible poursuivicommande. FAQSSR etJSONLD reprennent EXACTEMENT FAQa8EN
qualifiéephase1. Aucune promesse de nonstockage/suppression immédiate ni
chiffrement inventée. Modalités/durées restentàpréciser avantcommercial.

Audit evidence/source_handling_phase2_before_20261124.json etafter_20261124.json :
36pairesold/new, guardslegaux/checkout/FAQphase1 inchangésTrue. SHAlegal.*
926ec3fd...446e856 ; pagecheckout7e05fe92...0319c7 ; FAQphase1d8533646...73a3068.
VerrouhealthBody ancien volontairement remplacé par nouveauSHA95e435a4...96a7f6de
pour refléter le périmètre phase2 explicitement approuvé ; empreintescontrat et
versionsjuridiques/prix/flags inchangées. Aucun changement API/moteur/sourceTTL.

Qualification auteur puis principal : **npm test105/105PASS**, typesDOM/Worker0/buildPASS ;
JUnit evidence/source_handling_phase2_qualified_20261124.xml. Trois casajoutés :
fallbacks12×3+bootstraplanding, vraiSSRhealth/exemple et vraieFAQ/faq HTML+JSONLD.
Home resteunbootstrapuseEffect : sa copie est testée depuisexport/messages,
pasdepuisunehydrationbrowserimaginaire. Premier105cas104PASS/1FAIL conservé
danssource_handling_phase2_initial_20261124.xml : testavaitincorrectementexigé
FAQSSRsurhomepage ; bornéensuiteau /faq réellementserveur, pas contournement
parchangementproduit. Aucunbrowserréel ou providercontactéparcetagent.

Limites : rétention encoreàdéfinir/implémenter et validationjuridiqueglobale
non acquise ; copiesmarketing ne constituent pas unenforcement de stockage.
Fichiersgeneratedlanding/messages modifiés danspérimètre autorisé, générateur
designnonrelancé ; tests protègentcontre unerégénérationréintroduisantlesanciens
claims. Revue/rejeuprincipal avantpublication ; aucuncommit/push/merge/flagprod
ou politique30/90/365jours inventée par cetagent.

Rejeu principal indépendant du build et des tests le24novembre05:04UTC :
105/105PASS, preuve evidence/source_handling_phase2_principal_20261124.xml.
Les avertissements Vite (imports JSON/extensions et taille de chunk) sont
existants, non masqués et ne constituent pas une qualification navigateur.

## 23 novembre — phase1 FAQ traitement des sources corrigée, REVISE factuel

Branche codex/source-handling-faq-20261123 depuis3d7fb35, plan relu avant code.
ADAPTER les copies existantes, sans nouveau cadre juridique ni durée inventée.
Préflight communication trading lu ; recherche primaire CNIL transparence/
conservation France/UE réutilisée de la session principale23nov17:08UTC.
Périmètre websiteFR/EN+fallbacks, pas publicité payante/launch/conseil juridique.

Seulement faq.a8 : lignefallbacklanding et12messages(FR+11copiesENexistantes).
Le texte ne nie plus toute conservation ni toute exécution : non-publication/
non-revente, analyse statique OU exécution isolée selonprofil, sans ordre réel,
copie privée pouvantêtre conservée pouranalyse/suivicommande, modalités/durées
de suppression encoreàpréciser avantouverturecommerciale. AucunTTL30/90/365j
supposé, aucunclaimrendement ni nouveau consentement/contrat/prix/flag.

Audit durable evidence/source_handling_faq_before_20261123.json et
source_handling_faq_after_20261123.json :12pairesold/new sansPII ; SHA des
traductionslegal.* inchangé926ec3fd...446e856, healthBody inchangé23fae745...
527dc0 etpagecheckoutinchangée7e05fe92...0319c7. ContratCHECKOUT_CONTRACT
normaliséSHAa5090ef8...939de5 et empreintec6500f4c...e95c7c inchangés.
Ne pas présenter cette correction commevalidationjuridiqueREADY ou comme
politique de rétention techniquement activée : verdict **REVISE**, àfinaliser.

Qualification : **npm test102PASS**, typesDOM/Worker0 etbuildPASS ; preuve
evidence/source_handling_faq_qualified_20261123.xml. Trois nouveaux tests :
12messages etENfallbacks concordants, exportlandingMarkup identiqueàFAQEN,
smokes200 desshells / et/faq, guardslegal/health/contrat. Pasbrowser/hydration
revendiqués : landingMarkup est injecté paruseEffect, pasSSR ; /faq a sonpropre
components/faq/faq-data. Ancienstests tropglobaux échoués sontconservés dans
source_handling_faq_initial_20261123.xml puisfinal_20261123.xml(101/102).
Ils ont révélé les frontières du rendu, aucun texteproduit modifié pourcontourner.

**Phase2 ouverte, nontraitée ici** : ft.healthBody etautresclaims distincts,
ainsi que FAQSSR/faq-data gardent leur propre périmètre àvérifier/corriger.
Des fichiers temporaires Pine/MQL rendent certaines promesses «jamaisstocké»
trop fortes selon revueprincipale ; ce bloc ne les a PAS modifiées. Legalterms,
licence, Stripe, fingerprints etprix sontintacts. Aucuncommit/push/déploiement
ou lancementréel effectué par cet agent.

## 23 novembre — téléchargement natif final0518Z PASS, NON activé en production

Recette neuve conduite par principal APRÈS correctionWorker, sortie canonique
`evidence/PRIVATE_REPORT_BROWSER_20261123T0518Z/`. browser-proof.json et
attachment-observed.json lus sur disque : **PASS**, contrôleur exit0, fichier
natifstratverity-audit.html de9452octets, SHA
0e2823438bb4a144c0f8583a1e63a23ad9b6f74e367bcf1bd20f03a2196ca74c
identique au body HTTP. Sept headers attendus réellement observés, notamment
CSPstrict exacte et Referrer-Policy no-referrer désormais préservées par Worker.
Refus404JSONsafe/no-store avant disponibilité ;200attachment aprèsSUCCEEDED.
Les échecs0512/0515 restent CLOS INCHANGÉS et expliquent ce nouveau lot.

Classepreuve : Chrome télécharge réellement via cookiehandlerNext/proxyHTTP/
backend/composition/Docker locaux ; AuthSupabase, gatewayStripe et emailSES
restent fictifs. Une session/uneexécutionDocker, horloges UI/backend surcapture
historique et Auth/NodeSSR surtempsréel comme documenté précédemment. Pas de
provenance broker/paiement/email/fournisseur réel ni confidentialitéproduction
ou quotas physiques déduits. Aucune ouverture/interprétationHTML par l'UI.
Revue indépendante finale et publication pilotées par principal ; cet agent
n'a lancé aucun nouveau navigateur, effectuéaucuncommit/push/copiecanonique
ou activé de flag permanent.

Sources front figées, **99testsPASS +typesDOM/Worker/buildPASS** ; preuve
private_report_worker_front_final_20261123.xml et rejeu indépendant principal
private_report_front_principal_worker_final_20261123.xml (99PASS). Principal a
réellement ouvert les captures pending/ready et confirmé bouton/notice download.
Aucune capacité20ans ou couverturemulti-actifs supplémentaire déduite de cette
recette technique BTCM15 surcapture bornée. Les sections EN ATTENTE
ci-dessous décrivent les étapes HISTORIQUES avant cette recette finale.

## 23 novembre — correction Worker après observation navigateur,99testsPASS

Les recettes privées0512/0515 ne sont PAS qualifiées : téléchargement natif
de9452octets exacts et SHA0e282343...96ca74c observés, mais les headers CSP et
Referrer-Policy étaient remplacés par le wrapper Worker global. Diagnostic
durable attachment-observed.json sous PRIVATE_REPORT_BROWSER_20261123T0515Z.
Ne pas confondre fichier reçu avec conformité de sécurité complète.

Correction bornée worker/index.ts : conserver SEULEMENT la CSP restrictive
EXACTE interne du rapport et Referrer-Policy no-referrer EXACT ; toutes autres
CSP/referrer reviennent aux politiques globales antérieures. HSTS/DENY/nosniff/
Permissions-Policy/COOP/autresprotections inchangés. Pas de préservation générale
de headers amont susceptibles d'affaiblir le site ; aucun changement du contrat
bridge, bytes, MIME/filename, flags ou autre produit.

Trois nouveaux tests transpilent réellement Worker et fetchwrapper : attachment
strict avec bytes/statut/disposition conservés, pages ordinaires202 et fausses
CSP/referrer, erreurs404 et imagewrapper. npm test **99/99PASS**, DOM/Worker0 et
buildPASS ; JUnit evidence/private_report_worker_front_final_20261123.xml.
SHAworker AF82249324BF0593A13BDE5569FF448D7E1B166CD454AE88E30FCC9BECF57767.
Principal a aussi rejoué3testsWorkerPASS. Une NOUVELLE recette navigateur sur
ce correctif reste à faire par principal ;0512/0515 restent closes inchangées.
Pas de flagproduction, fournisseur réel, commit ou déploiement par cet agent.

## 23 novembre — téléchargement privé DEV construit, preuve navigateur EN ATTENTE

Décision **ADAPTER** bridge/client/retour privés existants, sans dépendance.
Plan relu avant code, recherche Playwright/React/Auth antérieure réutilisée ;
backend de confinement legacy conduit séparément par principal. Branche front
`codex/private-audit-report-front-20261123`, parent e779098. Aucun pilote
navigateur/Docker de téléchargement lancé à ce bloc, aucune activation réelle.

Ajout POSTreport : cookie serveur uniquement, scope/session exacts envoyés par
helper, aucun owner_token/reportID/URLGET/idempotency-key transmis. Opt-ins
serveur `STRATVERITY_PRIVATE_AUDIT_REPORT_LOCAL` et UI
`NEXT_PUBLIC_STRATVERITY_PRIVATE_AUDIT_REPORT_LOCAL` distincts OFF ; nécessitent
checkoutON + dev/local127. DefinesVite uniquementdansceprofildev. Rien dans.env.
Le backend reste autorité propriétaire/paiement/binding/jobSUCCEEDED/ledger.
Statuts incohérents readytrue/RUNNING ou jobnull maintenant refusés aussi par
client etproxy. Aucun droit de rapport déduit du seul booléen UI.

Proxy : requête64KiB, réponse binaire1..8MiB réels, y compris sans longueur,
annulation upstream sur erreurs/headeroversize/mismatch ; timeout20s, pasredirect,
pascompression inattendue. Réponse octetstream/attachment nomASCIIconstant
stratverity-audit.html, no-store/nosniff/no-referrer/noindex et CSP restrictive
incluant sandbox/frame-ancestorsnone ; Set-Cookie/Location/autresheadersamont
jamais relayés. Helper client recontrôle statut/MIME/disposition/taille réelle,
timeout/abort et ne parse ni ne rend leHTML. Aucun rapport stocké danslecache.

Nouveau `private-report-download.tsx` : bouton après ready, clic explicite,
busyref immédiat, relecture contexte strict, gardequery/fragment/unmount, abort
et URLBlob révoquée. Aucun iframe/innerHTML/navigationHTML/autodownload ; erreur
générique invite à revérifier la même tentative sans nouveau paiement. Un fichier
préparé pourdownload n'est pas une preuve de sauvegarde disque ou d'email reçu.
Configurateur/pricing/checkouts/flow/legacy/données/moteurs INCHANGÉS.

Qualification auteur : **npm test96/96PASS**, DOM/Worker0diagnostic/buildPASS.
JUnitdurable `evidence/private_report_front_global_20261123.xml`. Dix nouveaux
cas inclus dans96 : gating/auth/headers, borne8MiB/+1/flux/headeroversize,
annulation, bytesidentiques, jobguard, UIexplicite/OFF/doubleclic/stale/unmount,
révocationBlob et erreur sans détailprivé. Focus37PASS chevauchant ces tests,
PASadditionnable. Premierfocus35/36 conservé dans
`private_report_front_initial_20261123.xml` : harnaisTSX supposa tree nonnull
alors queflagOFF rendnull ; corrigé dansleharnais, pasdanslecontrat produit.

Limites : revue/rejeu principal requis ; pasencore de preuve téléchargement
Chrome via vraiproxy/backend, paspreuveStripe/Supabase/SES/broker réelle,
pasactivation/merge/déploiement. Attachment empêche le rendu par l'application,
pas une certification universelle du contenuHTML ouvert ensuite horsapplication.
La routelegacypublique est confinée danslebackend séparément ; nepas revendiquer
une confidentialité globale déployée àpartirde ce bloc frontendlocal.

## 22 novembre 22:50 UTC — recette finale PILOTE durci, PASS local seulement

La recette2246 reste close et ses artefacts sont INCHANGÉS. Une revue
indépendante a ensuite motivé un delta de HARNAIS SEULEMENT, pas de produit :
garde réseau limitée aux DEUX origines exactes site+Authfake (backend direct
interdit), WebSocket limité au site ; ownership ExitStack assurant fermeture
context puis browser même sur assertion ; hash fixture Auth AVANT exec_module
et recheck après import. Source finale driver SHA
`49d69e1c20f51a59af7a8181d02f61e68db9e9be681d46567ed81505c37d0f18`.
Sept tests unitaires sans service/Docker/browser ont été rejoués PASS ; sortie
durable `evidence/private_integrated_harness_unit_20261122.txt` (0.016s).
Ils couvrent origines/WS, import avant exécution/changement en cours, export
SHA sans clé brute, clé invalide et ordre de cleanup sur assertion.

Ce changement de pilote justifie UNE nouvelle sortie neuve
`SAAS_AUDIT_BACKTEST/evidence/PRIVATE_BROWSER_DOCKER_20261122T2250Z/`,
pas une relance inchangée du lot2246. `browser-proof.json` final lu sur disque :
PASS, contrôleur exit0,16pins stables, zéro exception navigateur ; deux
dispatches checkout mais UNE réponse reçue par la page (première201 attachée
puis abortée volontairement). Deux observations durables exportent les MÊMES
attempt/keySHA/requestSHA/quoteSHA/session/responseSHA, jamais la clé brute.
Une gatewayfixture et UN Docker, pendingfalse puis jobSUCCEEDED/DELIVERED,
report_ready=true via vrai handler-cookie Next/proxy/HTTP local. Pas de mock
source/freeze/quote/status. Les captures pending.png/ready.png sont conservées.

La preuve initiale2246 et ses limites d'export restent décrites ci-dessous à
titre historique ;2250 est la référence du HARNAIS FINAL. Les limites métier
restent identiques : Supabase Auth/Stripe/SES fictifs, code fixe technique,
horloge UI/backend historique sur capture21nov, NodeSSR et expiryAuth réels,
aucun fournisseur/paiement/email/déploiement/flagproduction réel. Les résultats
des deux lots ne sont pas additionnables ni une preuve d'idempotence universelle.
Le produit, ses86tests antérieurs et ses flags permanents sont INCHANGÉS.

## 22 novembre 22:46 UTC — recette navigateur/proxy/HTTP/Docker UNIQUE, locale seulement

Décision **ADAPTER** : réemploi par importlib d'Auth/USER/free_port du driver UI
déjà qualifié, sans copie de ces primitives ni dépendance installée. Nouveau
`tests/private-audit-integrated-browser.py` seulement ; aucun produit UI,
transport, proxy, moteur, Vite ou flag permanent modifié. Branche depuis3471eac.
La recherche/revue du bloc précédent est réutilisée, et le plan intégré a été
relu par principal avant lancement. Hermes reste verrouillé ; fallback GPT.

UNE exécution neuve autorisée par principal, sortie privée absolue :
`SAAS_AUDIT_BACKTEST/evidence/PRIVATE_BROWSER_DOCKER_20261122T2246Z/`.
`browser-proof.json` sur disque : **PASS**, contrôleur exit0 et16entrées épinglées
avant/après inchangées (sources front, deux drivers, contrôleur et4fichiers
capture). Syntaxe py_compile et --help du nouveau driver PASS.

Chrome neuf headless→vrai handler Next de cookiefixture→vrai proxy HTTP local→
composition backend→Docker réellement isolé/image épinglée→vrai statut privé.
Source exclusivement le témoin technique FIXE fourni par contrôleur ; aucun
code client réel. Auth et gateway/mail restent SIMULÉS. Environnement enfant
allowlisté, envDir Vite VIDE, aucune lecture .env ni session utilisateur. Tout
réseau navigateur non-loopback est bloqué AVANT navigation ; la navigation
Stripe exacte est observée puis ABORTÉE, jamais chargée ni route.fetch.
La seule interception est checkout : route.fetch vers le site local exact,
sans retry ni redirection,201JSON+body complet reçus, puis abort du premier
retour APRÈS attachement. Source/freeze/quote/status ne sont pas mockés.

Parcours réel : prix19€ immédiat avant fetch ; source200/freeze200/quote200 ;
premier checkout201 attaché mais réponse perdue ; reload ; reprise explicite
avec mêmes attempt/clé/body/devis/CS ; second checkout201. Une seule session
gatewayfixture. URL retour construite UNIQUEMENT depuis template serveur
épinglé inspecté, pas inventée par navigateur. Premier statut CHECKOUT_CREATED,
job/delivery null et report_ready=false ; commande stdin deliver→webhooksfake→
1Docker SUCCEEDED puis replay IDLE ; poll via même proxy retourne jobSUCCEEDED,
deliveryDELIVERED/report_ready=true. Cela ne prouve pas réception email réelle.
Cache seulement métadonnées, zéro exception navigateur. Captures pending.png
et ready.png conservées ; leur revue visuelle indépendante appartient au principal.
Principal confirme exit0 et a réellement ouvert ready.png. Limite du résumé
durable : operations ne montre QU'UNE réponse checkout côté navigateur, car la
première a été abortée après route.fetch. Le driver a asserté DEUX réponses201
et leur identité exacte en mémoire, corroborées par DEUX POST201 dans vite.log
et UNE session en SQLite ; il n'a pas exporté la liste des checkouts. Aucune
réécriture des artefacts2246 ni seconde campagne pour embellir cette preuve.
Une future recette pourra exporter les deux observations avec SHA de clé et
compteurs dispatch/réception plutôt que la clé brute.

Horloges distinctes et explicites : page.clock utilise UNIQUEMENT le cutoff
historique21nov22:30:42.762568UTC de la capture gelée. Auth expiry est calculée
sur heure réelle+3600s ; Node/SSR garde l'heure réelle ; contrôleur possède son
horloge historique injectée. Aucune actualisation des données22nov revendiquée.

Le backend a fourni finishproof et stop avec exit0. La preuve backend reste
générique (`browser_route_qualified=false` historique) ; la liaison navigateur
est portée par browser-proof séparée. Ne pas publier backend-private : SQLite,
HTML/enveloppes et fichiers techniques y restent privés. Pas de Stripe, SES,
Supabase, broker réel, validation exactement-une-fois sous tous crashes,
qualification ACL/quotas physiques/destinataire réel ou déploiement déduits.
Flags de recette existent uniquement dans les sous-processus détruits.

Reproduction (nouveau dossier absolu obligatoire, Python global Playwright
existant pour driver ; Python qualification pour contrôleur) :
`python tests/private-audit-integrated-browser.py --backend <backend-absolu>
--python <venv-qualification/Scripts/python.exe> --capture <CURRENT_FIVE_TF_20261121T2231Z>
--output <NOUVEAU-dossier-absolu>`.
Ne pas relancer ce lot clos ; prochaine porte = destinataire serveur/livraison
authentifiée et contrôles ACL/rétention, après revue indépendante.

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
