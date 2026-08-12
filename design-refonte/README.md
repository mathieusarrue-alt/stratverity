# StratVerity — Refonte visuelle (passe 1 : la landing)

> **Rien de l'app existante n'a été modifié.** Tout est neuf et isolé dans `design-refonte/`
> pour évaluation avant intégration. L'ancien logo et l'ancien frontend restent intacts.

## Direction artistique retenue
Fusion **« Verified Studio » × Swiss/Stripe** (tes choix 1 + 3) :
- papier chaud + **vert institutionnel** comme couleur de marque, surfaces blanches nettes ;
- grille précise, beaucoup de blanc, typographie forte (Inter + JetBrains Mono pour les chiffres, Fraunces en display) ;
- code couleur porteur de sens : **vert = vérifié**, **ambre = déclaré/non vérifié**, **rouge = risque/drawdown** ;
- mode **clair et sombre** réellement travaillés, motion subtile au scroll/survol, `prefers-reduced-motion` respecté, contrastes AA.

## Ce qui est livré
| Fichier | Contenu |
|---|---|
| `landing.html` | **Page d'accueil complète**, autonome (aucune dépendance à builder) : nav (Produit/Méthode/Recherche/Tarifs/FAQ + langue + clair-sombre + Connexion + CTA), hero « carte de preuve » animée, grille de vérifications (Profit Factor, net après frais, drawdown, robustesse, matrice multi-actifs, divergences), méthode 4 étapes, comparaison **déclaré vs vérifié**, matrice actifs×UT + score de robustesse + stress tests, recherche/biais, **rapport flouté à débloquer**, tarifs, FAQ, CTA, footer + avertissement risque. |
| `logos/mark-A-ascension.svg` | **S = courbe validée ascendante** (dégradé montant + check). |
| `logos/mark-B-strata.svg` | **S = strates / lignes de preuve** (registre, sur tuile claire). |
| `logos/mark-C-seal.svg` | **S en sceau** avec check (certification/confiance). |
| `logos/mark-D-monogram.svg` | **Monogramme géométrique** (le plus polyvalent, idéal favicon). |

Le logo actuellement câblé dans la landing = **variante A**. Dis-moi laquelle tu retiens
(ou un croisement) et je la fige + décline favicon/nav/grand format, clair et sombre.

## Comment visualiser
Double-clique `landing.html` (n'importe quel navigateur). Teste :
- l'icône **clair/sombre** (en haut à droite), l'icône **langue** (FR/EN actifs ; ZH/HI/ES/AR/PT/BN listés « bientôt » pour montrer l'architecture — l'arabe bascule en RTL) ;
- **réduis la fenêtre** pour voir le responsive tablette/mobile.

## Données = illustratives
Tous les chiffres sont marqués « Exemple illustratif ». Aucune performance présentée comme
résultat client réel, aucune promesse de gain — conforme à ta contrainte.

## Fichiers modifiés / créés
- **Modifiés :** aucun.
- **Créés :** `design-refonte/README.md`, `design-refonte/landing.html`, `design-refonte/logos/*.svg`.

## Prochaine passe (après ta validation du look + du logo)
1. **Intégration React/Next** : porter la landing dans `app/` (nouveau composant + `globals.css`
   refactoré en **tokens centralisés**, purge des systèmes morts design-a/design-b/concepts),
   sans toucher aux endpoints d'audit ni à la logique existante.
2. **i18n propre** pour les **8 langues les plus parlées** (EN, ZH, HI, ES, FR, AR, PT, BN),
   avec support **RTL** (arabe) et polices CJK — architecture déjà amorcée dans la preview.
3. **Uniformisation des autres pages** au nouveau système : `/configure`, `/configure/success`,
   `/admin`, `/legal/*`, et les états (paiement, attente de revue, erreur, chargement, vide).
4. **Favicon + jeu de logos** finalisés dans `public/`.

### À préserver impérativement (rappel, non touché ici)
routes, `pricing.ts` (`launch-v0.1`), Stripe Checkout, order/owner tokens, secret admin en mémoire seule,
validation humaine, accès temporaire au rapport, pages légales, aucun secret côté front, protections CORS/auth.
