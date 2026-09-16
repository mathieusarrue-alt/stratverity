# Win Rate vs Profit Factor : lequel regarder en premier ?

**Mots-clés** : win rate, profit factor, statistiques trading
**Temps de lecture** : 6 minutes
**Niveau** : Débutant à intermédiaire
**Objectif** : Comprendre pourquoi un winrate élevé peut cacher une stratégie perdante, et inversement

---

## Le problème : le winrate est la métrique la plus vendeuse et la moins fiable seule

"92% de trades gagnants" est le genre de chiffre qui fait vendre une stratégie en 5 secondes. C'est aussi, pris isolément, l'une des métriques les moins informatives sur la rentabilité réelle. Une stratégie peut gagner 9 trades sur 10 et perdre quand même de l'argent — et une stratégie qui ne gagne qu'un trade sur trois peut être excellente.

---

## 1. Définitions

### Win Rate

```
Win Rate = Nombre de trades gagnants / Nombre total de trades
```

Simple à calculer, simple à comprendre — et c'est précisément pour ça qu'il est le plus facile à manipuler ou à présenter de façon trompeuse.

### Profit Factor

```
Profit Factor = Somme des gains bruts / Somme des pertes brutes
```

Le Profit Factor (PF) mesure combien d'euros la stratégie gagne pour chaque euro perdu, toutes proportions confondues. Un PF de 1.5 signifie que la stratégie a gagné 1,50€ pour chaque euro perdu sur l'ensemble des trades perdants.

---

## 2. L'exemple qui montre pourquoi le winrate seul ne suffit pas

**Stratégie A — winrate élevé, mauvais payoff**

- Win Rate : 85%
- Gain moyen par trade gagnant : +0.5R
- Perte moyenne par trade perdant : -3R

Sur 100 trades : 85 gagnants × 0.5R = +42.5R, 15 perdants × 3R = -45R → **résultat net : -2.5R**. Cette stratégie perd de l'argent malgré 85% de trades gagnants.

**Stratégie B — winrate faible, bon payoff**

- Win Rate : 35%
- Gain moyen par trade gagnant : +3R
- Perte moyenne par trade perdant : -1R

Sur 100 trades : 35 gagnants × 3R = +105R, 65 perdants × 1R = -65R → **résultat net : +40R**. Cette stratégie est largement profitable malgré 65% de trades perdants.

C'est le mécanisme exact derrière la plupart des stratégies de trend-following professionnelles : winrate souvent sous 50%, profitabilité portée par quelques gros trades gagnants qui compensent largement les pertes fréquentes et petites.

---

## 3. Grille de lecture du Profit Factor

| Profit Factor | Interprétation |
|---|---|
| < 1.0 | Stratégie perdante — chaque euro perdu dépasse l'euro gagné |
| 1.0 - 1.3 | Marginale — les frais réels peuvent facilement l'annuler |
| 1.3 - 2.0 | Bonne, zone réaliste pour une stratégie robuste sur le long terme |
| 2.0 - 3.0 | Très bonne, à vérifier sur un échantillon large |
| > 3.0 | Suspect sur un backtest — quasiment jamais tenu en conditions live sur longue période |

Comme pour le Sharpe Ratio, un Profit Factor exceptionnellement élevé affiché sur un backtest est plus souvent le signe d'un biais (overfitting, look-ahead, échantillon trop petit) que d'une vraie pépite.

---

## 4. Comment les deux métriques doivent se lire ensemble

Ni le winrate ni le PF isolé ne suffisent. Ce qui compte, c'est le **ratio gain moyen / perte moyenne** (parfois appelé "payoff ratio" ou R-multiple moyen), croisé avec le winrate :

```
Profit Factor ≈ Win Rate × Gain moyen ⁄ ((1 − Win Rate) × Perte moyenne)
```

Cette relation explique pourquoi deux stratégies avec des winrates radicalement différents peuvent avoir le même Profit Factor, et pourquoi il faut toujours demander les trois chiffres ensemble : winrate, gain moyen par trade gagnant, perte moyenne par trade perdant.

### Ce que révèle la combinaison des trois

- **Winrate élevé + PF proche de 1** → payoff défavorable, souvent un signal d'alerte (stratégie de type "grignoter des petits gains, exposer à un gros risque")
- **Winrate bas + PF élevé** → stratégie de type trend-following, normale et souvent saine si le nombre de trades est suffisant
- **Winrate élevé + PF élevé** → combinaison rare et à vérifier en priorité pour de l'overfitting, surtout sur peu de trades

---

## 5. Pourquoi le nombre de trades change tout

Un Profit Factor de 3.5 calculé sur 12 trades n'a aucune valeur statistique — un seul trade différent peut faire basculer le chiffre du simple au double. Les métriques de winrate et de PF ne deviennent lisibles qu'à partir d'un échantillon suffisant (généralement 100+ trades, idéalement 200+ selon la fréquence de la stratégie).

---

## 6. Checklist avant de juger une stratégie sur ces deux métriques

- [ ] Winrate ET Profit Factor sont-ils communiqués ensemble (pas l'un sans l'autre) ?
- [ ] Le gain moyen et la perte moyenne par trade sont-ils précisés ?
- [ ] L'échantillon compte-t-il au moins 100-200 trades ?
- [ ] Le Profit Factor dépasse-t-il 3.0 ? Si oui, redoubler de vigilance sur le biais potentiel
- [ ] Les frais et le slippage sont-ils inclus dans le calcul du PF ?

## 7. La différence StratVerity

Un audit indépendant recalcule le winrate et le Profit Factor à partir des trades bruts recomputés (frais et slippage inclus), et les publie systématiquement ensemble avec le gain moyen et la perte moyenne par trade — jamais un chiffre isolé sans son contexte.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le winrate seul se vend bien, mais il ne dit rien sur la rentabilité réelle. Le Profit Factor seul cache la fréquence des gains. C'est leur combinaison — avec le gain moyen, la perte moyenne, et le nombre de trades — qui permet de juger réellement une stratégie. Méfiez-vous de tout vendeur qui n'affiche que le winrate.

*Vous voulez voir winrate, Profit Factor et payoff moyen d'une stratégie, calculés ensemble et de façon indépendante ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
