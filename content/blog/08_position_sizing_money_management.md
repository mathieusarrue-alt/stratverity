# Position sizing : pourquoi la meilleure stratégie du monde peut vous ruiner

**Mots-clés** : position sizing, money management, risque par trade, ruine trading
**Temps de lecture** : 8 minutes
**Niveau** : Intermédiaire
**Objectif** : Comprendre pourquoi le dimensionnement des positions détermine autant votre survie que la qualité du signal d'entrée

---

## Le problème : on optimise le signal, on néglige la taille

La quasi-totalité du temps passé à développer une stratégie va au signal d'entrée — quand acheter, quand vendre. Le dimensionnement de la position — **combien** risquer sur chaque trade — reçoit presque toujours moins d'attention, alors qu'il détermine à lui seul si une stratégie avec une espérance positive (voir notre article sur l'[espérance mathématique](/blog/esperance-mathematique-trading)) va enrichir un compte ou le ruiner malgré tout.

Deux traders peuvent utiliser exactement le même signal, avec la même espérance de +0.25R par trade, et l'un finit ruiné pendant que l'autre prospère — uniquement à cause de la taille des positions prises.

---

## 1. Le risque de ruine : la mathématique qui devrait faire peur

Même une stratégie avec une espérance largement positive peut mener à la ruine si le risque par trade est trop élevé, à cause de la variance et des séries de pertes consécutives qui surviennent inévitablement même sur une stratégie rentable.

**Exemple concret** : une stratégie avec un winrate de 40% aura, sur une série suffisamment longue, des séquences de 6, 8, parfois 10 pertes consécutives — un événement statistiquement normal, pas un signe que la stratégie a cessé de fonctionner. La probabilité d'observer au moins une série de 8 pertes consécutives sur 500 trades à 40% de winrate dépasse 85%. Ce n'est pas une anomalie à laquelle il faut réagir en coupant la stratégie — c'est une certitude mathématique à laquelle il faut survivre.

| Risque par trade | Impact d'une série de 8 pertes consécutives |
|---|---|
| 1% du capital | -7.7% du capital — absorbable, la stratégie continue normalement |
| 2% du capital | -14.9% du capital — douloureux mais gérable |
| 5% du capital | -33.7% du capital — nécessite un gain de +51% pour revenir au point de départ |
| 10% du capital | -57.0% du capital — nécessite un gain de +133% pour revenir au point de départ |

À 10% de risque par trade, une série de pertes parfaitement normale pour une stratégie à 40% de winrate suffit à mettre en péril la survie même du compte — indépendamment de la qualité du signal.

---

## 2. Les 3 méthodes de dimensionnement les plus courantes

### Risque fixe en pourcentage du capital

```
Taille de position = (Capital × % risqué) / Distance en points jusqu'au stop-loss
```

C'est la méthode la plus robuste et la plus simple à auditer : le risque s'ajuste automatiquement à l'evolution du capital (composé à la hausse comme à la baisse), et il est identique en proportion quelle que soit la volatilité du marché tant que le stop-loss est correctement placé.

**Fourchette usuelle** : 0.5% à 2% du capital par trade pour la grande majorité des stratégies systématiques. Au-delà de 2-3%, le risque de ruine devient significatif même avec une espérance solide.

### Taille fixe en unités (contrats, lots, actions)

Risquer toujours la même quantité, indépendamment du capital courant. Simple, mais ne s'ajuste pas à la croissance ou à la baisse du compte — un trader qui double son capital garde le même risque en euros qu'au départ, ce qui dilue mécaniquement l'effet de la croissance du compte.

### Dimensionnement ajusté à la volatilité (ATR-based)

```
Taille de position = (Capital × % risqué) / (Multiplicateur × ATR)
```

Utilise l'Average True Range (ATR) pour ajuster la distance de stop-loss — et donc la taille de position — à la volatilité récente du marché. Sur un actif devenu plus volatil, la taille de position diminue automatiquement pour maintenir un risque en euros constant. C'est la méthode la plus utilisée par les stratégies systématiques multi-actifs, car elle égalise le risque entre des instruments à volatilité très différente (une action et une cryptomonnaie, par exemple).

---

## 3. Le piège du money management "agressif" qui gonfle artificiellement les backtests

Certains vendeurs de stratégies présentent des backtests avec un risque par trade élevé (5%, 10%, parfois plus) précisément parce que ça **gonfle mécaniquement le rendement affiché** — au prix d'un drawdown et d'un risque de ruine que le backtest ne met pas suffisamment en avant.

**Signal d'alerte** : si un backtest affiche un rendement spectaculaire, toujours vérifier le pourcentage de risque par trade utilisé pour le calculer. Un rendement de +200% par an avec 8% de risque par trade n'a **rien à voir** en termes de risque réel avec le même rendement obtenu à 1% de risque — même si le chiffre affiché est identique.

**Règle de vérification simple** : demandez toujours le Max Drawdown associé au pourcentage de risque par trade utilisé dans le backtest (voir notre article sur le [Max Drawdown](/blog/max-drawdown)). Un rendement élevé sans ce contexte ne dit rien sur le risque réel encouru pour l'obtenir.

---

## 4. Le Critère de Kelly : la limite théorique, pas la cible pratique

Le Critère de Kelly calcule mathématiquement la fraction du capital à risquer pour maximiser la croissance géométrique à long terme, à partir du winrate et du ratio gain/perte :

```
Fraction de Kelly = Win Rate − ((1 − Win Rate) / Ratio gain/perte)
```

**Pourquoi ce n'est presque jamais la bonne taille à utiliser en pratique** : le Kelly complet suppose que le winrate et le ratio gain/perte sont connus avec exactitude — ce qui n'est jamais le cas en trading réel, où ces chiffres sont des estimations statistiques avec une marge d'erreur. Utiliser le Kelly complet avec des estimations légèrement optimistes (très courant sur un backtest) mène à un sur-risque sévère et à des drawdowns extrêmes.

**Pratique courante** : utiliser une fraction du Kelly calculé — un quart ou un demi-Kelly — pour absorber l'incertitude sur les paramètres estimés, tout en gardant un dimensionnement rationnel plutôt qu'arbitraire.

---

## 5. Le dimensionnement ne corrige jamais un signal sans edge

Point essentiel trop souvent oublié : aucune méthode de dimensionnement, aussi sophistiquée soit-elle, ne transforme une stratégie à espérance négative en stratégie rentable. Le position sizing détermine **la vitesse et la sécurité** avec laquelle une espérance positive se traduit en croissance de capital — il ne crée jamais d'edge qui n'existait pas.

Un money management parfait appliqué à une stratégie avec une espérance de -0.05R accélère simplement le chemin vers la perte, avec moins de variance sur le trajet. La priorité reste toujours de valider l'edge en premier (espérance positive, walk-forward robuste), avant d'affiner le dimensionnement.

---

## 6. Checklist avant de dimensionner vos positions

- [ ] Le risque par trade est-il fixé en pourcentage du capital courant, pas en montant fixe ?
- [ ] Le risque par trade dépasse-t-il 2-3% du capital ? Si oui, vérifier la probabilité de série de pertes consécutives associée au winrate de la stratégie
- [ ] Le Max Drawdown du backtest a-t-il été mesuré au même niveau de risque par trade que celui envisagé en réel ?
- [ ] Le dimensionnement s'ajuste-t-il à la volatilité de l'actif (ATR ou équivalent), en particulier sur un portefeuille multi-actifs ?
- [ ] L'espérance mathématique de la stratégie a-t-elle été validée en walk-forward avant de discuter du dimensionnement ?

## 7. La différence StratVerity

Un audit indépendant recalcule le drawdown et le résultat net pour plusieurs niveaux de risque par trade, pas seulement celui choisi par défaut dans le backtest original — pour que le lien entre rendement affiché et risque réellement pris soit explicite, jamais caché derrière un seul chiffre de performance.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le signal d'entrée décide si une stratégie a un edge. Le position sizing décide si vous survivez assez longtemps pour en profiter. Les deux sont indissociables : un edge médiocre avec un money management prudent bat presque toujours un edge excellent avec un risque par trade mal calibré. Avant d'adopter le pourcentage de risque affiché dans un backtest impressionnant, calculez toujours ce qu'il implique en cas de série de pertes normale pour cette stratégie.

*Vous voulez voir le Max Drawdown réel d'une stratégie à différents niveaux de risque par trade ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
