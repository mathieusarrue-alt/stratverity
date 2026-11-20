# Frontend — reprise publique et qualification locale

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
