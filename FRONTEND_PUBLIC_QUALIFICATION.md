# Frontend — reprise publique et qualification locale

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
