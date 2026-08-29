# Directions de logos produits — StratVerity

Statut : **propositions à valider par le fondateur — aucune intégration produit**.

## Invariants

- Le bouclier et le wordmark StratVerity restent intacts.
- Les marques produits sont des pictogrammes secondaires, pas des variantes du
  logo principal.
- Style vectoriel simple, lisible de 16 à 96 px, sans texte dans l'icône.
- Palette existante uniquement : forêt, émeraude, menthe et papier.
- Pas de glow néon, pas de gradient crypto, pas de chandeliers décoratifs, pas
  de symbole de gain ou de promesse de performance.
- Une seule géométrie de famille : stroke arrondi 1,75–2 px, grille 24 × 24,
  accent unique, version monochrome `currentColor` obligatoire.
- Les différences entre Audit, Marketplace et Optimiseur reposent d'abord sur
  la forme, jamais uniquement sur la couleur.

## Direction A — Instruments de preuve (recommandée)

Positionnement : un laboratoire qui mesure, vérifie et rend la preuve lisible.

### Audit

Un réticule de mesure composé de deux anneaux ouverts, quatre repères courts et
un trait de validation oblique. Le trait ne forme pas une flèche de performance :
il relie une mesure à son point validé.

### Marketplace

Trois modules rectangulaires reliés à un nœud central scellé. Le module central
porte un petit point de preuve, sans panier, étiquette de prix ni poignée de main.

### Optimiseur

Une matrice 3 × 3 dont trois cellules candidates convergent vers une cellule
sélectionnée entourée d'un anneau de mesure. Aucun graphe montant.

### Forces

- Très cohérent avec « Proof, not storytelling ».
- Technique sans ressembler à un terminal ou à un casino crypto.
- Facile à décliner dans les chips, cartes, navigation et rapports.
- L'Audit peut reprendre l'idée des anneaux de mesure déjà appréciée sans
  reproduire l'illustration bitmap ni modifier le bouclier de marque.

### Risque à contrôler

Le réticule Audit peut évoquer un radar : les repères doivent rester fixes et
le mot « Scan » ne doit jamais réapparaître dans les textes ou noms de fichiers.

## Direction B — Sceaux de confiance institutionnels

Positionnement : une autorité de certification indépendante et sobre.

### Audit

Un sceau circulaire interrompu contenant une coche géométrique et deux repères
de calibration.

### Marketplace

Deux plaques de certification superposées, reliées par un verrou central. La
composition représente l'accès vérifié, pas la vente du code source.

### Optimiseur

Un cadran de réglage à trois positions avec un point de consigne validé.

### Forces

- Confiance immédiate et forte lisibilité dans un badge public.
- Convient aux rapports, certificats et pages légales.
- Plus institutionnel que technologique.

### Risque à contrôler

Une balance gravée ou un blason supplémentaire ferait trop « cabinet juridique »
et entrerait en concurrence avec le bouclier StratVerity. Cette direction doit
donc rester géométrique et légère.

## Direction C — Géométrie de l'évidence

Positionnement : langage produit minimal, précis et orienté développeurs.

### Audit

Deux crochets de code entourent un point contrôlé et une coche courte :
`[ •✓ ]` réduit à ses seules formes géométriques.

### Marketplace

Deux maillons carrés ouverts partagent une arête certifiée. L'icône exprime la
mise en relation de produits audités, pas un téléchargement de source.

### Optimiseur

Trois curseurs orthogonaux se croisent sur un point de solution marqué.

### Forces

- Excellente lisibilité à 16–24 px.
- Très simple à implémenter en SVG accessible.
- Compatible avec la DA Linear/Vercel déjà utilisée dans l'interface.

### Risque à contrôler

Plus générique et moins propriétaire. Les proportions et l'arête de preuve
commune doivent être distinctives pour éviter un aspect de bibliothèque d'icônes.

## Système recommandé si la direction A est validée

| Produit | Forme dominante | Accent | Signification |
|---|---|---|---|
| Audit | Anneaux + repères | Menthe `#5FE3B0` | Mesurer et vérifier |
| Marketplace | Modules reliés | Émeraude `#16B981` | Distribuer un accès audité |
| Optimiseur | Matrice + cellule cible | Émeraude/menthe | Explorer puis sélectionner |

Les versions claires utilisent `forest-700` pour le trait et l'accent produit.
Les versions sombres utilisent `paper` pour le trait et le même accent. Aucun
logo ne dépend d'une ombre pour rester lisible.

## Livrables après validation

1. Une planche SVG des trois pictogrammes en 24, 48 et 96 px.
2. Versions dark, light et monochrome.
3. Composant `ProductMark` avec `product="audit" | "marketplace" | "optimizer"`.
4. Test de rendu statique et vérification des labels accessibles.
5. Intégration limitée aux cartes/navigation validées, sans modifier
   `StratVerityLogo.tsx`.

## Décision demandée

Choisir **A — Instruments de preuve**, **B — Sceaux institutionnels** ou
**C — Géométrie de l'évidence**. Il est aussi possible de retenir A pour Audit
et Optimiseur, avec le module Marketplace de C, mais une seule grammaire de
stroke et de cadre sera conservée.
