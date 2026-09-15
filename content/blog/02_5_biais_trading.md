# 5 biais qui faussent vos résultats de trading (et comment les détecter)

**Mots-clés** : biais trading, overfitting, look-ahead bias, survivorship bias, audit stratégie  
**Temps de lecture** : 10 minutes  
**Niveau** : Intermédiaire  
**Objectif** : Comprendre les 5 biais les plus courants et apprendre à les détecter

---

## Introduction : pourquoi votre stratégie "parfaite" échoue en live

Vous avez passé des semaines à développer une stratégie. Les backtests sont excellents : +45% sur 2 ans, Sharpe 2.1, max drawdown 12%. Vous êtes confiant.

Vous lancez en live. Et là, c'est la douche froide : la stratégie perd de l'argent.

**Pourquoi ?** Parce que votre backtest était biaisé. Pas forcément volontairement — la plupart des biais sont involontaires. Mais ils transforment une stratégie perdante en stratégie "gagnante" sur le papier.

Cet article vous présente les **5 biais les plus courants** en trading algorithmique, avec des exemples concrets et des méthodes pour les détecter.

---

## Biais 1 : Look-ahead bias (le plus vicieux)

### Qu'est-ce que c'est ?

Le look-ahead bias, c'est quand votre stratégie utilise des informations qui n'étaient **pas disponibles** au moment de la décision.

### Exemple concret (pseudocode)

Imaginez ce code :
- Pour chaque jour i
- Regarder le prix de clôture du jour i+1 (futur)
- Si prix demain > prix aujourd'hui, acheter aujourd'hui

**Pourquoi c'est biaisé** : au moment où vous prenez la décision (jour i), vous ne connaissez pas encore le prix du jour i+1. C'est comme parier sur un match après qu'il ait eu lieu.

### Exemple plus subtil

Imaginez que vous calculez la moyenne de tous vos rendements quotidiens, puis que vous normalisez chaque rendement par cette moyenne.

**Pourquoi c'est biaisé** : la moyenne utilise des rendements futurs. Au jour 1, vous ne connaissez pas encore les rendements des jours 100, 200, 300.

### Comment détecter

1. **Relisez votre code ligne par ligne**
2. **Pour chaque variable**, demandez-vous : "est-ce que cette information était disponible à l'instant t ?"
3. **Cherchez les indices** : accès à des données futures (i+1, i+2), moyennes globales, normalisations

### Comment corriger

**Règle d'or** : à l'instant t, vous ne pouvez utiliser que les données de 0 à t. Jamais t+1 ou au-delà.

---

## Biais 2 : Overfitting (trop de paramètres)

### Qu'est-ce que c'est ?

L'overfitting, c'est quand votre stratégie est **trop adaptée** aux données historiques. Elle "mémorise" le passé au lieu d'apprendre des patterns généraux.

### Exemple concret

Imaginez que vous optimisez une stratégie avec 10 paramètres :
- Période SMA rapide (5-50)
- Période SMA lente (20-200)
- Période RSI (5-30)
- Seuil RSI overbought (60-80)
- Seuil RSI oversold (20-40)
- Période ATR (5-30)
- Multiplicateur ATR (1.0-5.0)
- Stop loss % (0.5-5.0)
- Take profit % (1.0-10.0)
- Trailing stop (0.5-3.0)

**Problème** : avec 10 paramètres, chacun ayant 10-50 valeurs possibles, vous avez testé des **milliards de combinaisons**. Statistiquement, vous allez forcément trouver une combinaison qui a bien performé sur vos données historiques — mais c'est du hasard, pas du skill.

### Comment détecter

1. **Comptez vos paramètres optimisés**
   - ❌ Red flag : > 5 paramètres
   - ⚠️ Acceptable : 3-5 paramètres
   - ✅ Bon : 1-2 paramètres

2. **Faites du walk-forward**
   - Optimisez sur 2018-2020
   - Testez sur 2021-2023 (sans réoptimiser)
   - Si les résultats s'effondrent → overfitting

3. **Testez sur plusieurs actifs**
   - Si la stratégie ne fonctionne que sur EUR/USD → overfitting
   - Si elle fonctionne sur EUR/USD, GBP/USD, USD/JPY → probablement robuste

### Comment corriger

**Règle 1** : Limitez à 3-5 paramètres max

**Règle 2** : Utilisez des valeurs par défaut quand c'est possible
- SMA rapide = 20 (valeur standard)
- SMA lente = 50 (valeur standard)
- RSI période = 14 (valeur standard)

**Règle 3** : Faites du walk-forward systématiquement

---

## Biais 3 : Survivorship bias (les survivants)

### Qu'est-ce que c'est ?

Le survivorship bias, c'est quand vous ne testez que sur les actifs qui **existent encore aujourd'hui**, en ignorant ceux qui ont disparu (faillites, délistages).

### Exemple concret

Vous testez une stratégie "achat et conservation" sur le S&P 500 en utilisant uniquement les entreprises qui sont **aujourd'hui** dans l'indice.

**Problème** : entre 2010 et 2023, des dizaines d'entreprises ont été **retirées** du S&P 500 (faillites, rachats, délistages). En ne testant que sur les survivants, vous surestimez les rendements.

**Exemple réel** : Enron était dans le S&P 500 jusqu'à sa faillite en 2001. Si vous testez une stratégie sur 1995-2005 en utilisant uniquement les composants actuels du S&P 500, Enron n'apparaîtra pas — et vous manquerez la perte de -99%.

### Comment détecter

1. **Vérifiez la source de vos données**
   - Est-ce que la base inclut les actifs délistés ?
   - Est-ce que la base a un historique complet ?

2. **Cherchez les mentions**
   - "Current components only" → biaisé
   - "Including delisted securities" → correct

### Comment corriger

**Solution 1** : Utilisez des bases de données qui incluent les actifs délistés
- WRDS (Wharton Research Data Services)
- CRSP (Center for Research in Security Prices)
- Certains fournisseurs premium (pas gratuits)

**Solution 2** : Testez sur des ETF plutôt que des actions individuelles
- Les ETF ne "meurent" pas (ou rarement)
- Moins de survivorship bias

---

## Biais 4 : Cost model irréaliste (frais oubliés)

### Qu'est-ce que c'est ?

Le cost model bias, c'est quand votre backtest **ignore ou sous-estime** les coûts réels de trading.

### Les 3 coûts à inclure

#### 1. Commissions broker

**Exemple** : Interactive Brokers facture $1 par trade (actions US) ou 0.08-0.20 pips (forex).

**Impact** : une stratégie qui fait 1000 trades par an paie $1000 de commissions. Si elle fait +$2000 brut, elle ne fait que +$1000 net.

#### 2. Spread (différence bid/ask)

**Exemple** : EUR/USD a un spread de 1-2 pips en conditions normales.

**Impact** : à chaque trade, vous "payez" le spread. Si vous achetez à 1.1002 (ask) et vendez à 1.1000 (bid), vous perdez 2 pips même si le prix n'a pas bougé.

#### 3. Slippage (exécution dégradée)

**Exemple** : vous voulez acheter à 100€, mais le marché bouge et vous êtes exécuté à 100.50€.

**Impact** : le slippage est difficile à modéliser, mais il existe toujours. En conditions de forte volatilité, il peut être important.

### Exemple chiffré

Stratégie forex sur EUR/USD, 500 trades par an :

| Coût | Par trade | Annuel |
|---|---|---|
| Commission | $2 | $1000 |
| Spread (1.5 pips) | $15 | $7500 |
| Slippage (0.5 pips) | $5 | $2500 |
| **Total** | **$22** | **$11 000** |

Si votre stratégie fait +$15 000 brut, elle ne fait que +$4 000 net. Et si elle fait +$10 000 brut, elle **perd** $1 000 net.

### Comment détecter

1. **Vérifiez si les frais sont mentionnés**
   - "Frais inclus" → demander le détail
   - "Pas de frais" → red flag

2. **Estimez vous-même**
   - Nombre de trades × coût moyen par trade
   - Comparez au profit brut

### Comment corriger

Pour chaque trade, calculez :
- Profit brut = prix sortie - prix entrée
- Convertir en pips
- Soustraire spread + slippage
- Convertir en dollars
- Soustraire commission

---

## Biais 5 : Data snooping (cherry-picking)

### Qu'est-ce que c'est ?

Le data snooping, c'est quand vous **choisissez consciemment ou inconsciemment** les données qui arrangent votre stratégie.

### Exemples concrets

#### Exemple 1 : Cherry-picking de période

Vous testez sur 2018-2020, mais vous auriez pu tester sur 2015-2023. Pourquoi 2018-2020 ? Parce que c'est là que la stratégie performe le mieux.

**Problème** : vous avez choisi la période qui donne les meilleurs résultats. C'est du cherry-picking.

#### Exemple 2 : Cherry-picking d'actif

Vous testez sur 10 actifs (AAPL, MSFT, GOOGL, AMZN, TSLA, META, NFLX, NVDA, AMD, INTC), mais vous ne présentez que celui qui performe le mieux.

**Problème** : vous avez testé sur 10 actifs, mais vous ne montrez que le meilleur. C'est trompeur.

### Comment détecter

1. **Demandez la période complète**
   - "Pourquoi cette période spécifique ?"
   - "Avez-vous testé sur d'autres périodes ?"

2. **Demandez tous les actifs testés**
   - "Sur combien d'actifs avez-vous testé ?"
   - "Quels sont les résultats sur les autres actifs ?"

### Comment corriger

**Règle 1** : Testez sur la période la plus longue possible (pas de cherry-picking)

**Règle 2** : Testez sur tous les actifs pertinents (pas de cherry-picking)

**Règle 3** : Présentez **tous** les résultats, pas juste les meilleurs

---

## Comment StratVerity détecte ces 5 biais automatiquement

Détecter ces biais manuellement, c'est long et technique. C'est exactement ce que fait le moteur d'audit StratVerity :

| Biais | Détection automatique |
|---|---|
| **Look-ahead** | Analyse statique du code : détection d'accès à des données futures, normalisations globales |
| **Overfitting** | Comptage de paramètres optimisés + walk-forward automatique |
| **Survivorship** | Vérification de la base de données utilisée |
| **Cost model** | Simulation avec frais réalistes (commissions + spread + slippage) |
| **Data snooping** | Recommandation de périodes longues + tests multi-actifs |

**Résultat** : un score 0-100 qui reflète la **vraie** qualité de votre stratégie, pas les chiffres biaisés du backtest original.

**[Auditer ma stratégie gratuitement →](https://stratverity.com)**

---

## Tableau récapitulatif

| Biais | Détectable manuellement | Détectable automatiquement | Correction |
|---|---|---|---|
| Look-ahead | ⚠️ Difficile | ✅ Facile | Relire le code, vérifier indices |
| Overfitting | ✅ Facile | ✅ Facile | Limiter paramètres, walk-forward |
| Survivorship | ❌ Impossible sans bonne base | ⚠️ Partiel | Utiliser bases premium |
| Cost model | ✅ Facile | ✅ Facile | Inclure frais réalistes |
| Data snooping | ⚠️ Subjectif | ⚠️ Partiel | Périodes longues, tous actifs |

---

## Conclusion : ne faites plus confiance à un backtest non audité

Ces 5 biais sont **extrêmement courants**. La plupart des vendeurs de stratégies en ont au moins 2 ou 3 dans leurs backtests — souvent involontairement.

**Avant d'acheter une stratégie**, vérifiez :

- [ ] Pas de look-ahead bias (code relu)
- [ ] Pas d'overfitting (walk-forward effectué, ≤5 paramètres)
- [ ] Pas de survivorship bias (base de données complète)
- [ ] Pas de cost model bias (frais réalistes inclus)
- [ ] Pas de data snooping (période longue, tous actifs)

**Ou plus simple** : exigez un audit indépendant qui vérifie tout ça automatiquement.

---

*Vous voulez savoir si votre stratégie est biaisée ? [Auditez-la gratuitement sur StratVerity](https://stratverity.com) — détection automatique des 5 biais, score 0-100, badge vérifiable.*