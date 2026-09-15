# Comment lire un backtest honnête (sans se faire avoir)

**Mots-clés** : backtest honnête, biais backtest, audit stratégie trading, vérifier backtest  
**Temps de lecture** : 8 minutes  
**Niveau** : Débutant à intermédiaire  
**Objectif** : Apprendre à distinguer un backtest fiable d'un backtest trompeur

---

## Le problème : 80% des backtests que vous voyez sont faux

Vous avez probablement déjà vu ce genre de capture d'écran :

> "Ma stratégie a fait +347% en 12 mois ! 🚀"
> 
> [Graphique equity curve parfait, ligne droite montante]

Ça semble incroyable. Vous êtes tenté d'acheter. Mais voici la vérité : **la grande majorité de ces backtests sont trompeurs**, volontairement ou involontairement.

Pourquoi ? Parce qu'il est **très facile** de produire un backtest impressionnant. Trop facile.

Cet article vous apprend à lire un backtest avec un œil critique, pour ne plus jamais vous faire avoir.

---

## 1. Les chiffres à vérifier en premier

Quand quelqu'un vous montre un backtest, regardez **immédiatement** ces 5 métriques :

### 1.1 La période de test

**Question** : Sur combien de temps a été testée la stratégie ?

- ❌ **Red flag** : 3-6 mois (trop court, pas de cycle de marché)
- ⚠️ **Acceptable** : 1-2 ans
- ✅ **Bon** : 3-5 ans (inclut bull market + bear market)

**Pourquoi c'est important** : une stratégie peut très bien performer pendant un bull market et s'effondrer dès que le marché baisse. Si le backtest ne couvre que la période haussière, c'est un biais majeur.

### 1.2 Le nombre de trades

**Question** : Combien de trades ont été exécutés ?

- ❌ **Red flag** : < 50 trades (échantillon trop petit)
- ⚠️ **Acceptable** : 50-200 trades
- ✅ **Bon** : > 200 trades (statistiquement significatif)

**Pourquoi c'est important** : avec 20 trades, vous ne pouvez pas savoir si la stratégie est réellement profitable ou si c'est juste de la chance. Il faut un échantillon suffisant pour avoir confiance dans les résultats.

### 1.3 Le Sharpe Ratio

**Question** : Quel est le Sharpe Ratio ?

- ❌ **Red flag** : < 0.5 (mauvais rapport risque/rendement)
- ⚠️ **Acceptable** : 0.5-1.0
- ✅ **Bon** : > 1.5 (excellent rapport risque/rendement)

**Pourquoi c'est important** : le Sharpe Ratio mesure le rendement ajusté au risque. Une stratégie qui fait +50% avec un Sharpe de 0.3 est bien moins intéressante qu'une stratégie qui fait +20% avec un Sharpe de 2.0.

**Définition** : Sharpe = (Rendement - Taux sans risque) / Volatilité

### 1.4 Le Max Drawdown

**Question** : Quelle est la perte maximale subie ?

- ❌ **Red flag** : > 30% (trop risqué pour la plupart des traders)
- ⚠️ **Acceptable** : 15-30%
- ✅ **Bon** : < 15% (risque maîtrisé)

**Pourquoi c'est important** : le Max Drawdown est la perte maximale depuis un pic. Si votre stratégie a un drawdown de 40%, vous devez être prêt à voir votre compte baisser de 40% à un moment donné. Êtes-vous capable de supporter ça psychologiquement ?

### 1.5 Le Win Rate

**Question** : Quel pourcentage de trades gagnants ?

- ❌ **Red flag** : > 80% (probablement overfitté ou look-ahead)
- ⚠️ **Acceptable** : 40-60%
- ✅ **Bon** : 45-55% (réaliste)

**Pourquoi c'est important** : un win rate de 90% sur plusieurs centaines de trades est **très suspect**. Les meilleures stratégies professionnelles ont typiquement un win rate de 45-55%. Si quelqu'un vous promet 80%+, méfiance.

---

## 2. Les 5 questions qui révèlent les arnaques

Après avoir vérifié les chiffres, posez ces 5 questions au vendeur :

### Question 1 : "Quels frais avez-vous inclus ?"

**Réponse attendue** :
- Frais de transaction (commissions broker)
- Spread (différence bid/ask)
- Slippage (exécution à un prix moins bon que prévu)

**Red flag** : "Pas de frais" ou "Frais négligeables"

**Pourquoi** : les frais peuvent transformer une stratégie profitable en stratégie perdante. Exemple : une stratégie qui fait +15% brut peut faire -5% net après frais réalistes.

### Question 2 : "Avez-vous fait du walk-forward ?"

**Réponse attendue** :
- "Oui, j'ai optimisé sur 2018-2020, puis testé sur 2021-2023"
- "Oui, j'utilise une fenêtre glissante de 12 mois"

**Red flag** : "Non" ou "Je ne sais pas ce que c'est"

**Pourquoi** : le walk-forward est la **seule** façon de vérifier qu'une stratégie n'est pas overfittée. Sans walk-forward, vous ne pouvez pas savoir si les résultats sont réels ou artificiels.

### Question 3 : "Combien de paramètres avez-vous optimisés ?"

**Réponse attendue** :
- "3-5 paramètres max"
- "J'ai utilisé des valeurs par défaut"

**Red flag** : "15-20 paramètres" ou "J'ai optimisé tout ce qui pouvait l'être"

**Pourquoi** : plus vous optimisez de paramètres, plus vous risquez l'overfitting. Une stratégie avec 20 paramètres optimisés sur 2 ans de données a de fortes chances d'être parfaitement adaptée au passé mais inefficace en live.

### Question 4 : "Avez-vous testé sur plusieurs actifs ?"

**Réponse attendue** :
- "Oui, testé sur EUR/USD, GBP/USD, USD/JPY"
- "Oui, testé sur 10 actions différentes"

**Red flag** : "Non, juste sur EUR/USD" ou "Juste sur le S&P 500"

**Pourquoi** : une stratégie qui ne fonctionne que sur un seul actif est probablement overfittée aux caractéristiques spécifiques de cet actif. Une bonne stratégie devrait fonctionner sur plusieurs actifs similaires.

### Question 5 : "Avez-vous un track record live ?"

**Réponse attendue** :
- "Oui, voici mon compte Myfxbook vérifié"
- "Oui, voici mes résultats live depuis 6 mois"

**Red flag** : "Non, juste le backtest" ou "Le live c'est compliqué à mettre en place"

**Pourquoi** : un backtest, c'est bien. Un track record live vérifié, c'est **beaucoup** mieux. Si quelqu'un refuse de montrer ses résultats live, c'est probablement que sa stratégie ne fonctionne pas en conditions réelles.

---

## 3. Les red flags visuels (repérables en 5 secondes)

Certaines captures d'écran de backtest hurlent "arnaque" dès le premier coup d'œil :

### Red flag 1 : L'equity curve trop parfaite

**À quoi ça ressemble** : une ligne droite montante, sans aucune volatilité, sans drawdown visible.

**Pourquoi c'est suspect** : aucune stratégie réelle n'a une equity curve aussi lisse. Même les meilleures stratégies ont des périodes de stagnation, des drawdowns, de la volatilité.

### Red flag 2 : Le win rate > 85%

**À quoi ça ressemble** : "Win Rate : 92%" affiché en gros.

**Pourquoi c'est suspect** : un win rate aussi élevé sur plusieurs centaines de trades est statistiquement improbable. Soit c'est du look-ahead bias, soit c'est du sur-optimisation.

### Red flag 3 : Le profit factor > 5

**À quoi ça ressemble** : "Profit Factor : 7.3"

**Pourquoi c'est suspect** : un profit factor de 2-3 est déjà excellent. Un profit factor de 5+ est presque toujours le signe d'un backtest biaisé.

### Red flag 4 : Pas de période de test affichée

**À quoi ça ressemble** : juste les métriques, pas de dates.

**Pourquoi c'est suspect** : si quelqu'un cache la période de test, c'est probablement parce qu'elle est trop courte ou cherry-pickée.

---

## 4. Comment vérifier un backtest vous-même

Si vous voulez aller plus loin, voici comment vérifier un backtest :

### Étape 1 : Demandez le code source

Si le vendeur refuse de partager le code, méfiance. Une stratégie honnête n'a rien à cacher.

### Étape 2 : Reproduisez le backtest

Prenez le code, les données, et reproduisez le backtest vous-même. Les résultats doivent être identiques (à quelques centimes près).

### Étape 3 : Testez sur une période différente

Si le backtest original couvre 2018-2020, testez sur 2021-2023. Si les résultats s'effondrent, c'est de l'overfitting.

### Étape 4 : Testez sur un actif différent

Si la stratégie est conçue pour EUR/USD, testez sur GBP/USD. Si ça ne marche pas, la stratégie est probablement trop spécifique.

---

## 5. L'alternative : exigez un audit indépendant

Vérifier un backtest vous-même, c'est long et technique. L'alternative : **exigez un audit indépendant**.

C'est exactement ce que fait StratVerity :

1. **Vous uploadez la stratégie** (code Pine Script, MQL4/5, Python)
2. **Notre moteur l'analyse** automatiquement
3. **Nous détectons les biais** : look-ahead, overfitting, survivorship, cost model
4. **Nous générons un rapport** avec un score 0-100
5. **Vous obtenez un badge SHA-256** vérifiable on-chain

**Avantages** :
- Audit indépendant (pas le vendeur qui s'auto-évalue)
- Détection automatique des biais (vous ne les verriez pas)
- Badge vérifiable (n'importe qui peut vérifier l'authenticité)
- 3 audits gratuits par an (assez pour tester avant d'acheter)

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion : ne faites plus jamais confiance à un backtest non audité

Un backtest, c'est comme un CV : tout le monde peut écrire ce qu'il veut. La seule façon de savoir si c'est vrai, c'est de vérifier.

**Checklist rapide avant d'acheter une stratégie** :

- [ ] Période de test ≥ 2 ans
- [ ] Nombre de trades ≥ 200
- [ ] Sharpe Ratio ≥ 1.0
- [ ] Max Drawdown < 25%
- [ ] Win Rate 40-60%
- [ ] Frais réalistes inclus
- [ ] Walk-forward effectué
- [ ] Track record live vérifié
- [ ] **Audit indépendant** (le plus important)

Si un vendeur ne peut pas fournir ces éléments, passez votre chemin. Il y a des milliers de stratégies honnêtes sur le marché — pas besoin de prendre des risques avec des arnaques.

---

*Vous voulez vérifier une stratégie avant d'acheter ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*