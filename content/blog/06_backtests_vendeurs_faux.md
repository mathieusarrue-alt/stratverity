# Pourquoi les backtests des vendeurs sont (souvent) faux

**Mots-clés** : backtest faux, arnaque trading, vendeur stratégie
**Temps de lecture** : 8 minutes
**Niveau** : Tous niveaux
**Objectif** : Comprendre les mécanismes techniques — pas les intentions — qui produisent des backtests trompeurs

---

## Une précision avant de commencer

Cet article ne dit pas que la majorité des vendeurs de stratégies sont malhonnêtes. La plupart n'ont simplement jamais appris à se méfier de leur propre outil de backtest. Un backtest peut être trompeur **sans aucune intention de tromper** — c'est même le cas le plus fréquent. Comprendre les mécanismes techniques permet de juger n'importe quel backtest, y compris ceux produits de bonne foi.

---

## 1. Le look-ahead bias : voir le futur sans s'en rendre compte

C'est le biais le plus courant et le plus difficile à détecter de l'extérieur. Il se produit quand le code de backtest utilise, à un instant t, une information qui n'était en réalité disponible qu'après t.

**Exemples concrets** :

- Utiliser le prix de clôture d'une bougie pour décider d'entrer en position **sur cette même bougie**, alors qu'en temps réel la clôture n'est connue qu'à la fin de la bougie
- Calculer un indicateur (plus haut/plus bas sur N périodes) en incluant la période en cours plutôt qu'uniquement les périodes déjà closes
- Optimiser un paramètre sur toute la période testée, puis prétendre que ce paramètre était "connu" dès le début du backtest

Le look-ahead bias produit systématiquement des résultats trop beaux — winrate anormalement élevé, drawdown anormalement bas — parce que la stratégie "triche" en connaissant l'avenir immédiat à chaque décision.

---

## 2. L'overfitting : ajuster la stratégie au bruit, pas au signal

L'overfitting survient quand une stratégie est réglée avec tant de paramètres, ou des paramètres si précisément calibrés, qu'elle finit par coller parfaitement aux données historiques testées — au prix de ne plus généraliser à des données futures.

**Signal d'alerte** : plus il y a de paramètres optimisés (longueur de moyenne mobile, seuil RSI, multiplicateur ATR, filtre de session, etc.), plus le risque d'overfitting augmente de façon quasi-exponentielle. Une stratégie avec 3-5 paramètres réglés une fois est structurellement plus fiable qu'une stratégie avec 15-20 paramètres finement ajustés.

**Comment le détecter** : un backtest robuste doit tenir en **walk-forward** — optimisé sur une période (in-sample), puis testé sans réajustement sur une période suivante jamais vue (out-of-sample). Si les résultats out-of-sample s'effondrent par rapport à l'in-sample, c'est de l'overfitting.

---

## 3. Le survivorship bias : ne tester que ce qui a survécu

Ce biais est fréquent sur les backtests d'actions ou de cryptomonnaies sur longue période : si l'univers de test ne comprend que les actifs qui existent encore aujourd'hui, il exclut mécaniquement toutes les entreprises qui ont fait faillite ou toutes les cryptos qui sont mortes en cours de route — des actifs qui, eux, auraient généré des pertes massives.

Un backtest crypto "sur les 50 plus grosses capitalisations actuelles depuis 2018" ignore silencieusement les dizaines de projets qui ont disparu entre-temps — le résultat est structurellement trop optimiste.

---

## 4. Le modèle de coûts absent ou irréaliste

C'est le biais le plus facile à vérifier soi-même, et pourtant l'un des plus fréquemment ignorés :

- **Commission** absente ou sous-estimée
- **Spread** ignoré (particulièrement trompeur sur le forex et les CFD)
- **Slippage** ignoré — en réalité, une stratégie à haute fréquence de trading ou sur un actif peu liquide subit un écart entre le prix théorique du signal et le prix réel d'exécution
- **Funding rate** ignoré sur les futures perpétuels crypto — un coût continu qui peut représenter plusieurs points de pourcentage par an

Une stratégie qui fait +15% brut sur un backtest sans frais peut très bien finir à -5% net une fois des frais réalistes appliqués. Plus une stratégie trade fréquemment, plus cet écart est important.

---

## 5. Le data snooping : tester des centaines d'idées, ne montrer que la gagnante

Si vous testez 200 variantes de paramètres sur les mêmes données, il est statistiquement quasi certain qu'au moins une variante affichera d'excellents résultats **par pur hasard**, sans avoir de réel edge. Le vendeur ne montre que cette variante — sans préciser qu'elle est le résultat d'une recherche massive sur les mêmes données historiques (un phénomène connu sous le nom de "p-hacking" en statistique).

**Signal d'alerte** : une stratégie présentée avec des paramètres très spécifiques (ex : RSI période 13, seuil 27.3) sans justification logique est souvent le fruit d'une optimisation aveugle plutôt que d'une vraie logique de marché.

---

## 6. La fenêtre de test cherry-pickée

Choisir volontairement (ou involontairement) une période de test qui favorise la stratégie : tester un système long-only crypto uniquement sur 2020-2021 (bull market quasi ininterrompu), ou un système breakout uniquement sur une période de forte volatilité qui lui convient particulièrement.

**Vérification simple** : demandez systématiquement si le backtest couvre au moins un cycle de marché complet (hausse, correction, range) pour l'actif concerné.

---

## 7. Checklist de vérification rapide

Face à n'importe quel backtest présenté, ces questions permettent de filtrer la majorité des cas problématiques :

- [ ] La période couvre-t-elle au moins 2-3 ans, incluant une phase baissière ?
- [ ] Le nombre de trades dépasse-t-il 100-200 ?
- [ ] Les frais, spread et slippage sont-ils explicitement inclus ?
- [ ] Un test walk-forward (in-sample / out-of-sample) a-t-il été effectué ?
- [ ] Combien de paramètres ont été optimisés ?
- [ ] La stratégie a-t-elle été testée sur plusieurs actifs, ou seulement celui présenté ?
- [ ] Existe-t-il un track record live, pas seulement un backtest ?
- [ ] Le code source est-il disponible pour reproduction indépendante ?

Si un vendeur ne peut ou ne veut répondre à ces questions, c'est en soi une réponse.

## 8. La différence StratVerity

Un audit indépendant recompute le backtest à partir du code source, applique un modèle de frais et de slippage réaliste, détecte automatiquement le look-ahead bias et signale les paramètres à risque d'overfitting — puis confronte le résultat au track record live via l'API broker. C'est le même travail que fait un trader méthodique à la main dans notre article [Comment lire un backtest honnête](/blog/comment-lire-backtest-honnete), mais systématisé et vérifiable par n'importe qui via un badge SHA-256.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion : la méfiance n'est pas un manque de respect, c'est une méthode

Aucun de ces biais ne nécessite de mauvaise foi pour apparaître — ils sont la conséquence naturelle de la façon dont un backtest est construit si personne ne vérifie activement contre eux. La bonne question à poser n'est jamais "ce vendeur ment-il ?", mais "ce backtest a-t-il été vérifié indépendamment, ou seulement produit par la personne qui a intérêt à ce qu'il soit impressionnant ?"

*Vous voulez vérifier un backtest indépendamment avant d'acheter une stratégie ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
