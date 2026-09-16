# Max Drawdown : plus important que le profit

**Mots-clés** : max drawdown, risque trading, gestion du risque
**Temps de lecture** : 7 minutes
**Niveau** : Débutant à intermédiaire
**Objectif** : Comprendre pourquoi le Max Drawdown devrait être la première métrique regardée, avant le rendement

---

## Le problème : on regarde le gain avant le risque

Face à deux stratégies, le réflexe naturel est de comparer les rendements affichés. C'est l'ordre inverse de ce qu'il faudrait faire. Le rendement, c'est ce que vous *pourriez* gagner. Le Max Drawdown, c'est ce que vous *allez certainement* traverser à un moment — et c'est ce qui détermine si vous tiendrez la stratégie assez longtemps pour toucher le rendement promis.

---

## 1. Qu'est-ce que le Max Drawdown exactement

Le Max Drawdown (MDD) est la **plus grande baisse en pourcentage** entre un sommet (equity peak) et le creux qui suit, avant qu'un nouveau sommet ne soit atteint.

```
Drawdown à un instant t = (Sommet précédent − Valeur à t) / Sommet précédent
Max Drawdown = le plus grand drawdown observé sur toute la période
```

**Exemple concret** : un compte passe de 10 000€ à 15 000€ (nouveau sommet), puis retombe à 9 000€ avant de remonter. Le drawdown de cet épisode est (15 000 − 9 000) / 15 000 = **40%**. Peu importe que le compte reparte ensuite à 20 000€ : le 40% reste le Max Drawdown de la période, tant qu'aucun épisode pire n'est survenu.

---

## 2. Pourquoi c'est la métrique la plus importante

### La mathématique de la récupération est brutale et asymétrique

Perdre de l'argent nécessite un gain **disproportionné** pour revenir à l'équilibre :

| Perte subie | Gain nécessaire pour revenir au point de départ |
|---|---|
| -10% | +11% |
| -20% | +25% |
| -30% | +43% |
| -50% | +100% |
| -70% | +233% |
| -90% | +900% |

Un drawdown de 50% n'est pas "deux fois pire" qu'un drawdown de 25% — il exige une récupération quatre fois plus difficile. C'est pourquoi le seuil de tolérance chute très vite au-delà de 25-30%.

### Le facteur psychologique est le vrai tueur de stratégies

La plupart des traders qui abandonnent une stratégie rentable le font **pendant un drawdown**, pas après un backtest décevant. Un drawdown de 30% que vous n'avez jamais anticipé psychologiquement pousse à couper la stratégie au pire moment — juste avant qu'elle ne reparte. Le backtest ne peut pas mesurer votre tolérance émotionnelle ; c'est à vous de la confronter au chiffre affiché **avant** de mettre de l'argent réel.

---

## 3. Grille de lecture rapide

| Max Drawdown | Verdict | Profil de trader adapté |
|---|---|---|
| < 15% | Bon — risque maîtrisé | Tous profils, y compris conservateurs |
| 15-25% | Acceptable | Profil modéré, capital dédié au trading actif |
| 25-40% | Élevé | Réservé aux profils agressifs, taille de position réduite |
| > 40% | Dangereux | À éviter sauf allocation marginale et pleine conscience du risque |

Ces seuils sont des repères, pas des règles absolues — une stratégie à horizon très long terme sur des actifs volatils (crypto notamment) peut avoir un drawdown structurellement plus élevé qu'une stratégie forex intraday, sans que ce soit anormal pour la classe d'actif.

---

## 4. Les pièges du Max Drawdown affiché

### Le drawdown intra-trade vs le drawdown de clôture

Certains outils calculent le drawdown uniquement sur les valeurs de clôture de position, en ignorant les creux atteints **pendant** qu'un trade était encore ouvert. Un trade qui a été à -18% avant de finalement se refermer à +2% profitable n'apparaît nulle part dans ce calcul — alors qu'un trader avec un stop-loss serré ou un compte sous-capitalisé aurait été liquidé avant. Toujours demander si le drawdown est calculé sur l'equity intra-période ou seulement sur les clôtures.

### Le drawdown non capitalisé

Un drawdown calculé sur une equity non composée (chaque trade risque un montant fixe, jamais recalculé sur le capital courant) sous-estime le vrai risque en période de pertes consécutives, et surestime le vrai gain en période de gains consécutifs. Vérifier que le calcul utilise bien une equity composée si le money management de la stratégie l'est réellement.

### Le drawdown sur une seule séquence favorable

Un backtest sur 2020-2021 (bull market crypto quasi ininterrompu) affichera un Max Drawdown flatteur qui ne reflète rien de ce qui se passerait en 2022. Toujours vérifier que la période de test inclut au moins un épisode de correction sévère du marché concerné.

---

## 5. Checklist avant de faire confiance à un Max Drawdown affiché

- [ ] La période testée inclut-elle au moins une phase baissière significative du marché ?
- [ ] Le drawdown est-il calculé sur l'equity intra-trade ou seulement sur les clôtures ?
- [ ] L'equity est-elle composée de façon réaliste (risque en % du capital courant) ?
- [ ] Le Max Drawdown est-il cohérent avec le nombre de trades (un seul gros trade perdant peut fausser tout le calcul sur un petit échantillon) ?
- [ ] Existe-t-il un track record live confirmant (ou non) le drawdown du backtest ?

## 6. La différence StratVerity

Le Max Drawdown recalculé par un audit indépendant utilise l'equity intra-trade réelle, pas seulement les clôtures — et il est confronté à la dérive live observée via l'API broker, pas seulement affiché comme un chiffre de backtest isolé.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion : le drawdown avant le rendement, toujours

Avant de demander "combien ça peut rapporter", demandez "combien ça peut perdre, et suis-je prêt à le vivre". Une stratégie à +15% par an avec un drawdown de 10% est presque toujours un meilleur choix, sur la durée, qu'une stratégie à +80% par an avec un drawdown de 60% — parce que la seconde a de fortes chances d'être abandonnée avant même d'avoir eu le temps de rapporter quoi que ce soit.

*Vous voulez connaître le vrai Max Drawdown d'une stratégie avant d'y mettre de l'argent réel ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
