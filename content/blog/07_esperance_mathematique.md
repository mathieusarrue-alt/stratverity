# L'espérance mathématique : la seule métrique qui prédit si vous serez rentable

**Mots-clés** : espérance mathématique trading, expectancy, R-multiple, rentabilité stratégie
**Temps de lecture** : 7 minutes
**Niveau** : Intermédiaire
**Objectif** : Comprendre l'espérance mathématique (expectancy) et pourquoi c'est elle, et non le winrate ou le Profit Factor pris isolément, qui répond à la vraie question : "cette stratégie va-t-elle m'enrichir sur 1000 trades ?"

---

## Le problème : deux stratégies, un seul chiffre qui compte vraiment

Notre article précédent sur le [Win Rate vs Profit Factor](/blog/win-rate-vs-profit-factor) a montré que ces deux métriques, prises séparément, peuvent induire en erreur. L'espérance mathématique (ou *expectancy* en anglais) résout ce problème en condensant winrate, gain moyen et perte moyenne dans un **seul chiffre en unité de risque** : combien vous gagnez (ou perdez) en moyenne, par trade, pour chaque euro risqué.

C'est la métrique la plus proche d'une réponse directe à la question que tout trader se pose réellement : *"si je répète ce processus des centaines de fois, est-ce que je m'enrichis ?"*

---

## 1. La formule

```
Espérance = (Win Rate × Gain moyen) − (Taux de perte × Perte moyenne)
```

Exprimée en **R** (multiple du risque initial pris sur le trade — voir la section suivante), la formule devient :

```
Espérance (en R) = (Win Rate × Gain moyen en R) − ((1 − Win Rate) × Perte moyenne en R)
```

Une espérance de **+0.25R** signifie : en moyenne, chaque trade rapporte l'équivalent de 25% du risque initial pris sur ce trade. Répété sur 200 trades à risque constant de 1% du capital, cela représente un gain espéré théorique d'environ 50% du capital (avant capitalisation et hors variance) — un ordre de grandeur qui rend immédiatement lisible si une stratégie a un edge réel, indépendamment de son winrate affiché.

---

## 2. Pourquoi raisonner "en R" plutôt qu'en pourcentage ou en euros

Le "R" est le multiple du risque initial du trade : si vous risquez 100€ sur un trade (distance entre le prix d'entrée et le stop-loss, multipliée par la taille de position), un gain de 300€ vaut **+3R**, une perte de 100€ vaut **-1R**.

**Pourquoi c'est supérieur au pourcentage brut** :

- Deux trades peuvent avoir la même variation en pourcentage du capital mais un risque très différent (un stop serré vs un stop large) — le R normalise cette différence
- Le R permet de comparer des stratégies avec des tailles de position ou des niveaux de risque différents sur une base commune
- Le R rend l'espérance directement actionnable : une espérance de +0.2R avec un risque de 1% par trade donne un rendement espéré théorique de +0.2% du capital par trade, quel que soit l'actif ou le montant en jeu

---

## 3. Exemple chiffré complet

Reprenons les deux stratégies de notre article sur Win Rate vs Profit Factor, avec le calcul d'espérance :

**Stratégie A — winrate élevé, mauvais payoff**

- Win Rate : 85%, Gain moyen : +0.5R, Perte moyenne : -3R
- Espérance = (0.85 × 0.5) − (0.15 × 3) = 0.425 − 0.45 = **-0.025R**

Une espérance négative de -0.025R par trade. Sur 500 trades, cette stratégie perd en moyenne l'équivalent de 12.5 fois le risque unitaire — malgré un winrate de 85% qui semble spectaculaire.

**Stratégie B — winrate faible, bon payoff**

- Win Rate : 35%, Gain moyen : +3R, Perte moyenne : -1R
- Espérance = (0.35 × 3) − (0.65 × 1) = 1.05 − 0.65 = **+0.40R**

Une espérance de +0.40R par trade. Sur 500 trades, un gain espéré théorique de 200R — une stratégie largement rentable malgré 65% de trades perdants.

L'espérance rend ce résultat immédiat à lire, là où le winrate seul suggérait exactement l'inverse.

---

## 4. Grille de lecture

| Espérance (en R) | Interprétation |
|---|---|
| < 0 | Stratégie perdante en moyenne — aucun money management ne peut la sauver sur la durée |
| 0 à 0.10R | Marginale — les frais réels, le slippage ou une légère dégradation live peuvent l'annuler |
| 0.10 à 0.25R | Correcte, zone où se situent la plupart des stratégies systématiques robustes |
| 0.25 à 0.50R | Bonne à très bonne, à confirmer sur un échantillon large et en walk-forward |
| > 0.50R | Excellente si confirmée sur 200+ trades hors échantillon — sinon, suspecte |

Comme pour le Sharpe Ratio et le Profit Factor, une espérance extrêmement élevée affichée sur un backtest sur peu de trades est plus souvent un signal d'overfitting ou de look-ahead bias qu'une preuve de génie stratégique.

---

## 5. L'espérance ne dit rien sur la variance — et c'est le piège

Une espérance positive est une **condition nécessaire**, jamais suffisante. Elle décrit une moyenne, pas une trajectoire. Deux stratégies avec la même espérance de +0.20R peuvent avoir des parcours radicalement différents :

- **Stratégie régulière** : gains et pertes petits et fréquents, faible variance autour de la moyenne
- **Stratégie à queue lourde** : majoritairement de petites pertes, compensées par de rares trades à +8R ou +10R — même espérance, mais des séquences de pertes consécutives beaucoup plus longues avant qu'un gros gain ne survienne

La seconde stratégie a la même espérance mathématique, mais un profil de risque psychologique et de drawdown totalement différent (voir notre article sur le [Max Drawdown](/blog/max-drawdown)). C'est pour cette raison qu'une espérance positive doit toujours être lue à côté du nombre de trades consécutifs perdants observé et du drawdown maximal — jamais isolée.

---

## 6. Le piège du petit échantillon

L'espérance calculée sur peu de trades n'est pas fiable, pour une raison purement statistique : l'écart-type de l'estimation diminue avec la racine carrée du nombre de trades. Une espérance de +0.30R calculée sur 20 trades peut très bien être +0.05R ou -0.10R sur les 500 trades suivants — l'intervalle de confiance est simplement trop large pour trancher.

**Règle pratique** : ne considérer une espérance comme statistiquement significative qu'à partir de 100 trades, et la traiter comme provisoire jusqu'à 200-300 trades, idéalement répartis sur plusieurs régimes de marché différents.

---

## 7. Checklist avant de faire confiance à une espérance affichée

- [ ] L'espérance est-elle exprimée en R (unité de risque), pas seulement en pourcentage ou en euros ?
- [ ] Le nombre de trades dépasse-t-il 100, idéalement 200-300 ?
- [ ] Le winrate et le ratio gain moyen/perte moyenne sont-ils communiqués à côté, pas seulement l'espérance finale ?
- [ ] Le calcul inclut-il les frais et le slippage réalistes ?
- [ ] L'espérance a-t-elle été vérifiée en walk-forward (in-sample vs out-of-sample) plutôt que sur l'historique complet ?
- [ ] Le drawdown maximal et la plus longue série de pertes consécutives sont-ils cohérents avec l'espérance affichée ?

## 8. La différence StratVerity

Un audit indépendant recalcule l'espérance à partir des trades bruts recomputés, exprimée en R, avec les frais et le slippage inclus — et la confronte systématiquement au nombre de trades disponible, au drawdown maximal et à la robustesse walk-forward. Une espérance positive présentée seule, sans ce contexte, n'est jamais suffisante pour juger une stratégie.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le winrate se vend bien, le Profit Factor rassure, mais c'est l'espérance mathématique — exprimée en R et confirmée sur un échantillon suffisant — qui répond à la seule question qui compte réellement : est-ce que ce processus, répété des centaines de fois, m'enrichit en moyenne ? Une espérance positive et robuste, même faible, vaut mieux qu'un winrate impressionnant qui cache une espérance négative.

*Vous voulez connaître l'espérance mathématique réelle d'une stratégie, calculée en R et vérifiée en walk-forward ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
