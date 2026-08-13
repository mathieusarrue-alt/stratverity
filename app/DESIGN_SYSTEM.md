# Système visuel StratVerity

La source de vérité créative est `design-refonte/landing.html`. Le script
`scripts/port-design-refonte.mjs` en extrait les tokens, la landing et les 145
messages de chacune des 12 langues vers l'application. Les fichiers générés ne
doivent pas être modifiés directement.

## Direction

- Positionnement : Verified Studio × Swiss/Stripe.
- Palette : papier chaud, vert institutionnel, ambre réservé aux avertissements
  et rouge réservé aux risques ou refus.
- Typographies : Inter pour l'interface, Fraunces pour les grands titres et
  JetBrains Mono pour les métriques. Les scripts arabe, bengali, devanagari,
  chinois et coréen utilisent les variantes Noto déclarées dans `layout.tsx`.
- Logos officiels : `public/brand-light.svg`, `public/brand-dark.svg` et
  `public/favicon.svg`.

## Tokens et thèmes

Tous les tokens globaux vivent dans `globals.css` : couleurs, surfaces, lignes,
ombres, rayons, espacements et transitions. Le thème actif est porté par
`html[data-theme]`. Les pages actives consomment ces variables et ne redéfinissent
pas de palette concurrente.

## Composants communs

- `SiteHeader` : marque, navigation, 12 langues, clair/sombre et menu mobile.
- `.btn`, `.card`, `.price`, `.stat` : primitives de surface communes.
- Les pages `/configure`, `/configure/success`, `/admin` et `/legal/*` réutilisent
  les mêmes tokens, contrastes et états de focus.
- `/login` et `/account` utilisent le même vocabulaire de cartes, preuves,
  quadrillage discret et appels à l'action. La connexion client ne doit jamais
  rediriger vers la console opérateur `/admin`.

## Accessibilité et mouvement

- focus clavier visible sur liens, boutons et champs ;
- `prefers-reduced-motion` coupe les animations non essentielles ;
- réseau animé et effets de pointeur désactivés sur tactile ou mouvement réduit ;
- arabe en RTL avec `lang` et `dir` appliqués au document ;
- les chiffres de performance de la landing restent explicitement identifiés
  comme exemples illustratifs.
