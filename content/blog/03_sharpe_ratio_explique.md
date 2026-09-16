# Le Sharpe Ratio expliqué simplement

**Mots-clés** : sharpe ratio trading, ratio rendement risque
**Temps de lecture** : 6 minutes
**Niveau** : Débutant
**Objectif** : Comprendre ce que mesure vraiment le Sharpe Ratio et pourquoi il vaut mieux qu'un simple pourcentage de gain

---

## Le problème : "+50% en un an" ne dit presque rien

Deux stratégies affichent toutes les deux +50% sur un an :

- **Stratégie A** : progression régulière, quelques accoups, drawdown maximal de 8%
- **Stratégie B** : +120% en 3 mois puis -70% en 4 mois puis remontée, drawdown maximal de 55%

Le rendement brut est identique. Personne de sensé ne préfère pourtant la stratégie B. Le Sharpe Ratio est l'outil qui met un chiffre sur cette différence : il mesure le rendement **par unité de risque pris**, pas le rendement seul.

---

## 1. La formule (sans jargon)

```
Sharpe = (Rendement de la stratégie − Taux sans risque) / Volatilité des rendements
```

- **Rendement de la stratégie** : la performance annualisée
- **Taux sans risque** : ce que rapporterait un placement quasi certain (bon du Trésor, livret). Souvent approximé à 0 pour le trading court terme, ce qui simplifie sans trop déformer le résultat
- **Volatilité** : l'écart-type des rendements — à quel point les résultats varient d'une période à l'autre

En clair : le Sharpe divise ce que vous avez gagné par à quel point c'était chaotique de le gagner.

---

## 2. Comment lire un chiffre de Sharpe

| Sharpe | Interprétation |
|---|---|
| < 0 | La stratégie perd de l'argent en moyenne |
| 0 à 0.5 | Rendement ajusté au risque faible — à comparer à un placement passif |
| 0.5 à 1.0 | Correct, sans être remarquable |
| 1.0 à 1.5 | Bon — la plupart des fonds professionnels tournent dans cette zone |
| 1.5 à 2.5 | Très bon, rare en conditions réelles sur longue période |
| > 3.0 | Suspect sur un backtest — vérifier look-ahead bias, overfitting, ou fenêtre de test trop courte |

Le dernier point est important : un Sharpe extrêmement élevé sur un backtest n'est presque jamais un signe de génie stratégique, c'est le signe le plus fréquent d'un backtest biaisé (voir notre article [Comment lire un backtest honnête](/blog/comment-lire-backtest-honnete)).

---

## 3. Ce que le Sharpe Ratio NE mesure PAS

### Il ne dit rien sur le drawdown maximal

Deux stratégies peuvent avoir le même Sharpe avec des profils de drawdown très différents — l'une avec des pertes fréquentes et petites, l'autre avec une perte rare mais énorme qui a été lissée dans la moyenne. Le Sharpe est une moyenne, pas un pire cas. Pour ça, il faut regarder le Max Drawdown séparément (voir notre article dédié).

### Il pénalise la volatilité à la hausse comme à la baisse

Le Sharpe traite un gain inattendu de +5% en une journée exactement comme une perte inattendue de -5% : les deux augmentent la volatilité et font baisser le ratio. C'est une limite connue — le **Sortino Ratio** corrige ce défaut en ne comptant que la volatilité négative, mais il est moins utilisé en pratique.

### Il dépend fortement de la période de calcul

Un Sharpe calculé sur 3 mois de bull market et un Sharpe calculé sur 3 ans incluant une correction ne racontent pas la même histoire. Toujours vérifier la période sur laquelle le chiffre a été calculé avant de le comparer à un autre.

---

## 4. Sharpe annualisé : attention au calcul

Le Sharpe est presque toujours annualisé pour permettre les comparaisons entre stratégies à fréquences de trading différentes. La formule d'annualisation dépend de la fréquence des données :

```
Sharpe annualisé = Sharpe (période) × √(nombre de périodes par an)
```

- Rendements journaliers → multiplier par √252 (jours de bourse par an)
- Rendements hebdomadaires → multiplier par √52
- Rendements mensuels → multiplier par √12

**Piège fréquent** : un vendeur qui calcule le Sharpe sur des rendements par trade (et non par période calendaire) puis multiplie par un facteur d'annualisation destiné aux rendements journaliers gonfle artificiellement le chiffre. Si une stratégie fait beaucoup de trades par jour, cette confusion peut multiplier le Sharpe affiché par un facteur de 2 à 5.

---

## 5. Sharpe élevé ≠ stratégie à acheter

Un bon Sharpe Ratio est une condition nécessaire, jamais suffisante. Avant de faire confiance à un chiffre affiché :

- [ ] Vérifier la période de calcul (idéalement ≥ 2 ans, incluant une phase baissière)
- [ ] Vérifier que les frais et le slippage sont inclus dans les rendements utilisés
- [ ] Comparer au Max Drawdown — un Sharpe correct avec un drawdown de 60% reste un mauvais pari
- [ ] Vérifier le nombre de trades — un Sharpe calculé sur 15 trades n'est pas statistiquement fiable
- [ ] Demander si le calcul est fait sur backtest seul, ou aussi sur un track record live

## 6. La différence StratVerity

Le Sharpe Ratio affiché dans un post marketing est déclaratif — personne ne vérifie comment il a été calculé, sur quelle période, ni avec quels frais. Un audit indépendant recompute le Sharpe à partir des trades bruts recalculés, avec des frais et un slippage réalistes, et le publie à côté du Max Drawdown et du nombre de trades — pas isolé.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le Sharpe Ratio répond à une question précise : *"pour le risque pris, combien j'ai gagné ?"* — pas à *"combien j'ai gagné ?"* tout court. Un chiffre isolé sans période, sans nombre de trades et sans Max Drawdown à côté ne permet pas de juger une stratégie. Demandez toujours le contexte, jamais seulement le chiffre.

*Vous voulez vérifier le Sharpe Ratio réel d'une stratégie avant d'acheter ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
