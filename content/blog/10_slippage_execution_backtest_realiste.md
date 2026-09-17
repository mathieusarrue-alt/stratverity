# Slippage et exécution réelle : pourquoi votre backtest ment sur l'exécution

**Mots-clés** : slippage, exécution ordre, backtest réaliste, liquidité trading
**Temps de lecture** : 7 minutes
**Niveau** : Intermédiaire
**Objectif** : Comprendre ce qui sépare un prix théorique de signal d'un prix réel d'exécution, et comment modéliser cet écart correctement dans un backtest

---

## Le problème : le backtest suppose une exécution parfaite qui n'existe pas

Un backtest classique calcule un trade comme si l'ordre avait été exécuté **exactement** au prix du signal — la clôture de la bougie, ou le niveau exact du stop-loss. En réalité, entre le moment où le signal se déclenche et le moment où l'ordre est réellement rempli, le prix a presque toujours bougé, ne serait-ce que de quelques fractions de seconde. Cet écart s'appelle le **slippage**, et il n'est presque jamais nul.

Sur une stratégie qui trade rarement avec des cibles larges, le slippage est un détail négligeable. Sur une stratégie à haute fréquence de trading ou sur un actif peu liquide, il peut à lui seul transformer une stratégie profitable en stratégie perdante.

---

## 1. D'où vient le slippage, concrètement

### La latence d'exécution

Entre l'instant où votre code détecte un signal et l'instant où l'ordre atteint effectivement le marché, il s'écoule un délai — souvent quelques dizaines à quelques centaines de millisecondes pour un système retail classique, mais qui peut atteindre plusieurs secondes en cas de connexion instable ou de VPS mal positionné géographiquement par rapport au serveur du broker. Pendant ce délai, le prix continue de bouger.

### La profondeur de marché insuffisante

Un ordre de taille importante par rapport au volume disponible au meilleur prix (le "carnet d'ordres") doit "consommer" plusieurs niveaux de prix successifs pour être entièrement rempli — chaque niveau supplémentaire étant légèrement moins favorable que le précédent. Ce phénomène s'aggrave fortement sur les actifs peu liquides ou en dehors des heures de forte activité.

### La volatilité au moment de l'exécution

Sur une annonce macroéconomique, un flash crash, ou simplement une bougie à forte amplitude, l'écart entre le prix attendu et le prix obtenu peut se compter en dizaines de pips sur le forex, ou en pourcentages significatifs sur des actifs volatils comme les cryptomonnaies.

### Le type d'ordre utilisé

- **Ordre au marché** : exécution quasi immédiate garantie, mais au prix disponible au moment de l'exécution — c'est la source principale de slippage
- **Ordre limite** : le prix est garanti (ou meilleur), mais l'exécution ne l'est pas — l'ordre peut ne jamais être rempli si le marché ne revient pas au niveau demandé, ce qui introduit un biais différent (des trades "manqués" que le backtest doit aussi modéliser correctement)

---

## 2. L'impact chiffré selon le type de stratégie

| Type de stratégie | Sensibilité au slippage | Exemple d'impact |
|---|---|---|
| Position trading (holding plusieurs jours/semaines) | Très faible | Quelques points de base sur un mouvement de plusieurs centaines de pips — négligeable |
| Swing trading (holding quelques heures/jours) | Faible à modérée | 0.5-2 pips par trade sur forex majeurs, peut représenter 5-15% du profit moyen par trade |
| Scalping / haute fréquence | Élevée | Le slippage peut représenter 30-70% du profit théorique par trade — souvent le facteur qui détermine à lui seul si la stratégie est viable en réel |
| Actifs peu liquides (small caps, altcoins) | Très élevée | Le slippage peut dépasser 100% du profit attendu sur un trade de taille significative |

**Règle pratique** : plus une stratégie trade fréquemment avec des cibles de profit serrées, plus le slippage doit être modélisé avec précision — c'est exactement l'inverse de l'intuition qui pousse souvent à le négliger parce que "ça ne représente que quelques pips".

---

## 3. Comment un backtest honnête modélise le slippage

### Modèle fixe (le plus simple, le plus courant)

Ajouter un nombre de pips ou un pourcentage fixe défavorable à chaque exécution (achat plus cher, vente moins cher). Simple à implémenter, mais ne capture pas la variation du slippage selon la volatilité ou la liquidité du moment.

### Modèle proportionnel à la volatilité

Faire varier le slippage modélisé en fonction de l'ATR (Average True Range) au moment du trade — plus le marché est volatil, plus le slippage simulé augmente. Plus réaliste que le modèle fixe, en particulier pour les stratégies qui tradent sur des cassures ou pendant des pics de volatilité, précisément les moments où le slippage réel est le plus élevé.

### Modèle basé sur le carnet d'ordres (le plus rigoureux, le plus rare)

Simuler la consommation réelle du carnet d'ordres niveau par niveau à partir de données de profondeur de marché historiques. Rarement accessible en dehors d'infrastructures institutionnelles, mais c'est la référence de fidélité pour les stratégies très sensibles à la liquidité.

**Le pire des cas — le plus fréquent chez les vendeurs de stratégies** : aucun modèle de slippage du tout. Le backtest suppose une exécution au prix exact du signal, systématiquement.

---

## 4. Le cas particulier des ordres au stop-loss et take-profit

Un piège spécifique et fréquent : un backtest qui suppose que le stop-loss se déclenche **exactement** au niveau fixé. En réalité, sur un marché qui gap (ouverture avec un écart par rapport à la clôture précédente, fréquent sur actions et forex le week-end, ou sur crypto lors d'un mouvement violent), l'ordre stop peut être exécuté bien au-delà du niveau prévu — parfois avec un écart de plusieurs pourcents sur des actifs volatils.

**Vérification à faire** : le backtest simule-t-il les gaps de prix entre les bougies pour les ordres stop, ou suppose-t-il systématiquement une exécution parfaite au niveau exact ? La différence peut être considérable sur des stratégies avec des stops serrés sur des actifs sujets aux gaps.

---

## 5. Checklist avant de faire confiance à l'exécution d'un backtest

- [ ] Le slippage est-il modélisé explicitement, ou le backtest suppose-t-il une exécution parfaite au prix du signal ?
- [ ] Le modèle de slippage s'ajuste-t-il à la volatilité, ou est-il fixe quelle que soit la situation de marché ?
- [ ] Les ordres stop-loss/take-profit tiennent-ils compte des gaps de prix entre bougies ?
- [ ] La fréquence de trading et la liquidité de l'actif justifient-elles une modélisation fine du slippage, ou est-ce négligeable pour cette stratégie ?
- [ ] Un track record live confirme-t-il que l'écart entre performance backtest et performance réelle reste dans une fourchette raisonnable ?

## 6. La différence StratVerity

Un audit indépendant applique un modèle de slippage réaliste ajusté au type d'instrument et à la fréquence de trading de la stratégie testée, plutôt qu'un chiffre générique identique pour tous les cas — et signale explicitement quand une stratégie est structurellement trop sensible au slippage pour être viable en conditions réelles, indépendamment de la qualité de son signal d'entrée.

**[Essayer StratVerity gratuitement →](https://stratverity.com)**

---

## Conclusion

Le prix du signal et le prix réellement obtenu à l'exécution ne sont presque jamais identiques — et l'écart grandit avec la fréquence de trading, la volatilité, et l'illiquidité de l'actif. Un backtest qui ignore ce facteur mesure une stratégie qui n'existe pas : celle d'un monde où chaque ordre se remplit instantanément au prix exact désiré. Toujours demander comment le slippage a été modélisé avant de faire confiance à un rendement affiché.

*Vous voulez savoir si une stratégie résiste à un modèle de slippage réaliste ? [Essayez StratVerity gratuitement](https://stratverity.com) — 3 audits par an, sans engagement.*
