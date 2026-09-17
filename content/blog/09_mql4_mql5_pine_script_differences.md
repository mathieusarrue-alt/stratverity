# MQL4 vs MQL5 vs Pine Script : ce que ça change pour auditer une stratégie

**Mots-clés** : MQL4, MQL5, Pine Script, langages trading algorithmique, audit code stratégie
**Temps de lecture** : 8 minutes
**Niveau** : Intermédiaire à avancé
**Objectif** : Comprendre les différences structurelles entre les trois langages les plus utilisés pour coder des stratégies, et pourquoi elles influencent directement la fiabilité d'un backtest

---

## Le problème : le langage n'est pas neutre pour la qualité du backtest

Une stratégie codée en MQL4 sur MetaTrader 4, la même logique codée en MQL5 sur MetaTrader 5, et une version équivalente en Pine Script sur TradingView peuvent produire des backtests aux résultats sensiblement différents — pas parce que la logique de trading change, mais parce que **chaque plateforme gère différemment l'exécution, les ticks, le multi-actifs et le multi-timeframe**. Comprendre ces différences est indispensable pour juger si un backtest présenté dans l'un de ces trois environnements reflète fidèlement ce qui se passerait en conditions réelles.

---

## 1. MQL4 : le vétéran, avec des limites structurelles connues

MQL4 est le langage de MetaTrader 4, la plateforme la plus répandue historiquement chez les brokers retail forex et CFD.

**Ce qu'il faut savoir pour l'audit d'un backtest MQL4** :

- **Modèle de backtest historique par défaut** : MT4 propose plusieurs modes de simulation ("Every tick", "Control points", "Open prices only"). Le mode "Open prices only" — le plus rapide, donc souvent utilisé par défaut lors de tests rapides — ne simule **aucun mouvement intra-bougie**, ce qui rend impossible la détection correcte d'un stop-loss touché avant un take-profit sur la même bougie. Un backtest MQL4 en "Open prices only" surestime systématiquement la performance des stratégies avec des stops serrés.
- **Un seul actif, un seul timeframe par test natif** : tester une stratégie multi-actifs nécessite soit un Expert Advisor spécifique par paire, soit des solutions de portefeuille tierces — ce qui complique la vérification qu'une stratégie multi-actifs a réellement été testée simultanément sur tous les instruments concernés plutôt que testée séparément puis additionnée.
- **Gestion du temps serveur vs temps broker** : les horodatages dépendent du fuseau horaire du serveur du broker, une source d'erreur classique quand on compare un backtest exécuté chez deux brokers différents.

---

## 2. MQL5 : plus rigoureux, mais pas automatiquement plus fiable

MQL5 (MetaTrader 5) corrige plusieurs limites structurelles de MQL4, mais n'élimine pas le besoin de vérification.

**Différences clés pour l'audit** :

- **Simulation "tous les ticks réels" disponible** : MT5 peut simuler avec des données de ticks réels historiques (si le broker en fournit), donnant une reconstruction beaucoup plus fidèle du mouvement intra-bougie que "Open prices only" en MQL4. Mais cette qualité dépend entièrement de la disponibilité et de la qualité des données ticks du broker utilisé pour le backtest — deux backtests identiques chez deux brokers différents peuvent diverger si l'un a des données ticks plus pauvres.
- **Multi-actifs natif via `CopyRates`/`CopyClose`** : MQL5 permet de récupérer les données d'autres symboles depuis un seul Expert Advisor, ce qui facilite (sans le garantir) le test réellement simultané de stratégies multi-actifs.
- **Netting vs Hedging** : MT5 supporte deux modes de comptabilisation des positions (netting : une seule position nette par symbole ; hedging : positions multiples simultanées, y compris opposées, sur le même symbole). Un backtest en mode hedging peut afficher des métriques de performance très différentes du même code testé en netting — toujours vérifier quel mode a été utilisé, car il change fondamentalement la façon dont les gains et pertes se compensent.

---

## 3. Pine Script : puissant pour visualiser, à surveiller pour le non-repaint

Pine Script (TradingView) est devenu le langage de référence pour le partage et la visualisation d'indicateurs et de stratégies, avec un piège spécifique qui lui est propre.

**Points de vigilance spécifiques à Pine Script** :

- **Le repainting** : c'est le biais le plus caractéristique de Pine Script. Une fonction comme `request.security()` mal utilisée (sans `lookahead=barmerge.lookahead_off` et sans décalage d'indice `[1]`) peut faire apparaître un signal sur une bougie passée qui n'aurait, en réalité, jamais été visible à ce moment-là en temps réel. Un script qui "repaint" produit un backtest visuellement impressionnant qui ne se reproduit jamais en live, parce que le signal affiché sur l'historique n'était en réalité pas disponible au moment de la décision.
- **`calc_on_every_tick` et l'exécution intra-bougie** : par défaut, une `strategy()` Pine Script recalcule seulement à la clôture de chaque bougie, sauf si `calc_on_every_tick=true` est activé. Ce paramètre change la précision d'exécution simulée, en particulier pour des stratégies avec des sorties rapides.
- **Profondeur d'historique variable selon le timeframe et le forfait TradingView** : les scripts basés sur `request.security()` pour accéder à un timeframe supérieur (HTF) peuvent avoir une profondeur d'historique disponible plus courte que le graphique principal, ce qui tronque silencieusement la période réellement testée sans que ça soit visible directement dans les statistiques du Strategy Tester.
- **Le Strategy Tester intègre commission et slippage configurables** — mais ils sont à zéro par défaut. Un backtest Pine Script présenté sans mention explicite de ces deux paramètres a de très fortes chances d'avoir été généré avec des frais nuls.

---

## 4. Tableau comparatif synthétique

| Critère | MQL4 | MQL5 | Pine Script |
|---|---|---|---|
| Simulation intra-bougie par défaut | Souvent "Open prices only" (faible fidélité) | "Tous les ticks réels" disponible (haute fidélité si data broker correcte) | Clôture de bougie par défaut, tick-by-tick en option |
| Multi-actifs natif | Limité, solutions tierces courantes | Supporté via `CopyRates` | Supporté via `request.security()`, avec risque de repaint si mal utilisé |
| Risque de repaint | Faible (structure procédurale classique) | Faible | **Élevé si `request.security()` mal configuré** |
| Frais/slippage par défaut | Configurable, souvent oublié | Configurable, souvent oublié | Configurable, **zéro par défaut** |
| Mode netting/hedging | Netting uniquement | Choix explicite netting/hedging | Non applicable (pas de gestion de compte réel) |

---

## 5. Pourquoi ça compte pour l'audit indépendant

Auditer une stratégie correctement ne se limite pas à relire la logique d'entrée et de sortie — il faut aussi vérifier que **le langage et la configuration de test utilisés n'ont pas, structurellement, gonflé le résultat** avant même que le code ait été mal écrit. Un code de stratégie parfaitement honnête peut produire un backtest trompeur simplement parce qu'il a été testé en "Open prices only" (MQL4), avec des frais à zéro (Pine Script), ou avec des données ticks pauvres (MQL5) — sans qu'aucune ligne de code ne soit en cause.

C'est pourquoi un audit sérieux doit connaître les spécificités de chaque plateforme, pas seulement analyser la logique de trading dans l'abstrait.

---

## 6. Checklist par langage avant de faire confiance à un backtest

**MQL4** :
- [ ] Quel mode de simulation a été utilisé ("Every tick", "Control points", "Open prices only") ?
- [ ] La stratégie a-t-elle été testée sur plusieurs paires simultanément, ou séparément puis additionnée ?

**MQL5** :
- [ ] Les données ticks utilisées proviennent-elles d'un broker fiable, avec un bon historique ?
- [ ] Le mode netting ou hedging utilisé est-il précisé, et cohérent avec l'usage réel prévu ?

**Pine Script** :
- [ ] Le script utilise-t-il `request.security()` avec `lookahead_off` et un décalage `[1]` correct ?
- [ ] Commission et slippage sont-ils configurés dans les propriétés de la stratégie, ou laissés à zéro ?
- [ ] `calc_on_every_tick` est-il activé pour les stratégies à sortie rapide ?

## 7. La différence StratVerity

StratVerity audite nativement le code source en Pine Script (v5 et v6), MQL4 et MQL5 — en recalculant les trades avec un modèle de frais et de slippage réaliste, et en détectant les biais spécifiques à chaque langage (repaint Pine Script, mode de simulation MQL4, configuration netting/hedging MQL5) plutôt que d'appliquer un modèle générique identique à tous les langages.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le langage dans lequel une stratégie est codée n'est jamais un détail technique neutre — il détermine le niveau de fidélité par défaut du backtest, et introduit des pièges spécifiques (repaint en Pine Script, "Open prices only" en MQL4, mode netting/hedging en MQL5) que la logique de trading elle-même ne révèle pas. Vérifier ces paramètres de plateforme est une étape à part entière de tout audit sérieux, avant même de juger la qualité du signal.

*Vous voulez auditer une stratégie Pine Script, MQL4 ou MQL5 avec les vérifications spécifiques à chaque plateforme ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
