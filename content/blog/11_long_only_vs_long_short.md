# Long-only vs Long/Short : ce que ça change pour le risque et le backtest

**Mots-clés** : long only, long short, stratégie trading, exposition directionnelle
**Temps de lecture** : 7 minutes
**Niveau** : Intermédiaire
**Objectif** : Comprendre l'impact structurel du choix long-only vs long/short sur la robustesse d'un backtest et l'exposition réelle au risque

---

## Le problème : un backtest flatteur qui ne teste qu'un seul régime de marché

Une stratégie long-only (qui n'ouvre que des positions acheteuses) testée sur une période de hausse quasi ininterrompue affichera presque toujours un excellent backtest — pas nécessairement parce que le signal d'entrée est bon, mais parce que **le marché lui-même montait pendant toute la période testée**. C'est l'un des pièges les plus fréquents et les plus difficiles à repérer sans creuser, parce que le backtest lui-même semble parfaitement propre : pas de look-ahead bias, pas d'overfitting évident, juste un marché qui a porté la stratégie.

---

## 1. Définitions

### Long-only

La stratégie ne prend que des positions acheteuses (long). Elle profite des hausses, reste en dehors du marché ou subit les baisses pendant les phases baissières, selon qu'elle a un mécanisme de sortie ou non.

### Long/Short

La stratégie peut prendre des positions acheteuses (long) **et** vendeuses (short), lui permettant en théorie de générer du profit aussi bien en marché haussier que baissier.

---

## 2. Comment distinguer un vrai edge d'un simple effet de marché

**Test décisif** : comparer la performance de la stratégie long-only à la performance du marché lui-même (buy-and-hold) sur la **même période exacte**.

| Scénario | Interprétation |
|---|---|
| Stratégie +40%, marché +45% (buy-and-hold) | La stratégie a probablement sous-performé un simple achat-et-conservation — le signal n'apporte rien, voire détruit de la valeur en ajoutant des frais de transaction pour un résultat inférieur |
| Stratégie +40%, marché +8% | La stratégie génère une réelle surperformance — le signal d'entrée/sortie apporte quelque chose de mesurable au-delà de la tendance générale |
| Stratégie +5%, marché -30% | La stratégie a limité les pertes pendant une phase baissière — un signe de robustesse potentiellement plus significatif que la performance brute en marché haussier |

**Erreur fréquente** : présenter uniquement le rendement absolu de la stratégie, sans jamais le confronter au rendement du marché sur la même fenêtre. Un rendement de +150% peut sembler impressionnant tout en étant, en réalité, une sous-performance déguisée si le marché a fait +300% sur la même période — c'est un cas fréquent sur les cryptomonnaies en 2020-2021.

---

## 3. Pourquoi le long/short est structurellement plus difficile à valider — et à exécuter

### Avantage théorique : l'indépendance au régime de marché

Une stratégie long/short bien construite peut, en théorie, générer un edge quel que soit le sens du marché — un avantage réel pour la robustesse hors échantillon, en particulier face à un changement de régime que le backtest n'a pas couvert.

### Complications pratiques souvent sous-estimées

- **Le short est structurellement plus risqué** : la perte potentielle sur une position vendeuse est théoriquement illimitée (le prix d'un actif peut monter indéfiniment), contrairement au long où la perte est plafonnée à 100% du capital investi
- **Les coûts d'emprunt** : shorter un actif implique souvent un coût d'emprunt de titres (sur actions notamment) ou un funding rate défavorable (sur les futures perpétuels crypto) qui n'est pas toujours modélisé dans le backtest — voir notre article sur les [backtests des vendeurs](/blog/backtests-vendeurs-faux)
- **La disponibilité du short** : tous les actifs ne sont pas "shortables" facilement ou à un coût raisonnable, en particulier sur les petites capitalisations en actions
- **L'asymétrie comportementale** : les marchés baissent généralement plus vite qu'ils ne montent (la fameuse asymétrie de volatilité), ce qui rend le timing d'un short structurellement plus exigeant

**Vérification essentielle pour un backtest long/short** : le modèle de coûts inclut-il un coût d'emprunt ou un funding rate réaliste pour les positions vendeuses ? L'absence de cette ligne de coût est l'un des biais les plus fréquents — et les plus faciles à manquer — sur les backtests long/short présentés sans détail.

---

## 4. Comment auditer correctement une stratégie selon son type

### Pour une stratégie long-only

- Comparer systématiquement à la performance buy-and-hold sur la même période exacte
- Vérifier que la période de test inclut au moins une phase de correction ou de marché baissier significatif de l'actif concerné
- Examiner ce qui se passe pendant les phases baissières : la stratégie reste-t-elle en dehors du marché, ou continue-t-elle à perdre de l'argent passivement ?

### Pour une stratégie long/short

- Vérifier que les deux côtés (long et short) sont testés sur des échantillons suffisants séparément — une stratégie peut avoir un edge réel côté long et aucun edge côté short (ou l'inverse), et la performance combinée peut masquer ce déséquilibre
- Vérifier explicitement la présence d'un coût d'emprunt ou de funding rate dans le modèle de coûts
- Comparer la performance sur un sous-échantillon de marché haussier et un sous-échantillon de marché baissier séparément — un vrai edge long/short devrait montrer une robustesse dans les deux régimes, pas une dépendance à un seul

---

## 5. Le diagnostic long-only vs long-only-avec-filtre-de-tendance

Une distinction souvent négligée : une stratégie long-only qui n'entre en position que lorsqu'un filtre de tendance (une moyenne mobile, par exemple) confirme un contexte haussier n'est **pas** une stratégie long/short — elle reste unidirectionnelle, mais elle a un mécanisme qui limite l'exposition pendant les phases défavorables. C'est une différence importante à clarifier dans tout audit : "cette stratégie évite-t-elle les phases baissières, ou est-elle simplement absente du marché la plupart du temps sans mécanisme explicite ?"

---

## 6. Checklist avant de juger une stratégie selon son exposition directionnelle

- [ ] La performance a-t-elle été comparée à un simple buy-and-hold sur la même période exacte ?
- [ ] La période testée inclut-elle au moins une phase baissière significative de l'actif concerné ?
- [ ] Pour une stratégie long/short : les coûts d'emprunt ou de funding rate sont-ils inclus dans le modèle ?
- [ ] Pour une stratégie long/short : les performances long et short sont-elles présentées séparément, ou seulement combinées ?
- [ ] La stratégie a-t-elle un mécanisme explicite pour limiter l'exposition en marché défavorable, ou dépend-elle entièrement du hasard du timing d'entrée ?

## 7. La différence StratVerity

Un audit indépendant recalcule systématiquement la performance d'une stratégie long-only face au buy-and-hold de la même période, et vérifie pour les stratégies long/short que les coûts d'emprunt ou de funding sont bien intégrés au modèle — deux vérifications rarement faites spontanément par un vendeur de stratégie, parce qu'elles tendent à réduire, pas gonfler, le chiffre final présenté.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Une stratégie long-only testée en marché haussier et une stratégie long/short testée avec des coûts de short réalistes ne racontent pas la même histoire — et confondre "la stratégie a un edge" avec "le marché montait pendant le test" est l'une des erreurs de jugement les plus fréquentes et les plus coûteuses. Toujours comparer au buy-and-hold, et toujours vérifier le modèle de coûts du short avant de faire confiance à un backtest long/short.

*Vous voulez savoir si une stratégie surperforme réellement le marché, ou si elle en profite simplement ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
