# Contrat stratégie Python supporté — v1 (chemin labo .py)

> Source de vérité du contrat entre le **client** (fichier `.py`) et le **labo
> d'audit** StratVerity. Hors contrat → **rejet avant Stripe** ou message
> `LAB_UNSUPPORTED` — jamais un paiement sans livraison.

## 1. Format supporté (v1)

- Fichier : un seul `.py` contenant une stratégie déterministe.
- **Stdlib uniquement** (ni `numpy`, ni `pandas`, ni `talib`, ni module externe).
  Toute stratégie qui `import` un module non-stdlib est **hors contrat** (v1).
- Sans look-ahead : la décision au bar `i` n'utilise que les données `<= i`.
  (Le labo verifie provisoirement, mais le client s'engage.)

## 2. Signature exacte

```python
# fichier .py livré par le client — une seule fonction publique `run`
def run(bars: list[dict]) -> list[dict]:
    """bars  : [{"open","high","low","close","timestamp"}] chrono croissant,
               (floats + timestamp ISO str ou ms).
    return : liste de trades "à la façon CanonicalTrade" :
             [{"direction":"long"|"short","entry_price":..,"exit_price":..,
               "entry_time":..,"exit_time":..,"quantity":..,
               "commission":0.0,"slippage_cost":0.0}, ...]
    """
```

- Le labo (adaptateur Engine) convertit ce retour en `CanonicalTrade` interne.
- **Frais par défaut déjà appliqués par le labo** : commission **2 bps/côté** +
  slippage **2 bps/côté**, même si le client renvoie 0. (documenté, non enlevable).

## 3. Hors contrat (v1) → rejet

- Import `numpy` / `pandas` / `talib` / `sklearn` / tout module non-stdlib.
- Signature manquante (`run` absente) ou `bars` non list.
- Multi-fichiers / zips contenant d'autres langages.
- → **ni checkout ni paiement** ; message « format Python non supporté à ce jour ».
- Tout format non supporté (`.mq5` non labo) suit la même règle `LAB_UNSUPPORTED`.

## 4. Côté front

Avant tout appel Stripe, le client de la page `/configure` vérifie la conformité
(heuristique : scan `import` numpy/pandas/talib). Non conforme → blocage checkout
+ message. (Pré-requis front à brancher — voir le gate.)

## 5. Livraison

Une commande conforme → `report_html` + ledger `DELIVERED` (+ email au client s'il
en fournit un). Aucun rapport inventé ; les métriques viennent du lab réel.