# Guide de déploiement StratVerity

Mise à jour : 2026-08-20

Ce document est la procédure de référence pour déployer le frontend StratVerity sans dépendre de ChatGPT. Il peut être exécuté par Mathieu ou par une IA disposant des accès GitHub et AWS nécessaires.

## Architecture

- Dépôt : https://github.com/mathieusarrue-alt/stratverity
- Branche de production : main
- Région : eu-west-3
- Application Amplify : StratVerity Frontend Production
- App ID : d1ybxnm394w3bh
- Prévisualisation : https://main.d1ybxnm394w3bh.amplifyapp.com
- Domaine public : https://www.stratverity.com
- API : https://api.stratverity.com

Amplify est connecté directement à GitHub. Un push sur main déclenche l'auto-build. GitHub Actions exécute en parallèle la qualité et la détection de secrets. Garder AWS_DEPLOY_ENABLED à false tant que l'auto-build Amplify est actif pour éviter un double déploiement.

Le build OpenAI Sites reste disponible comme rollback. Le build AWS utilise vinext, Nitro, amplify.yml et scripts/patch-amplify-runtime.mjs.

## Prérequis

Vérifier :

    git --version
    node --version
    npm --version
    aws --version
    aws sts get-caller-identity
    aws configure get region

Node 22.13.0 et la région eu-west-3 sont attendus. Docker est facultatif.

Ne pas utiliser le compte root AWS au quotidien. Préférer IAM Identity Center ou GitHub OIDC avec des permissions minimales.

## Variables publiques Amplify

- NEXT_PUBLIC_BACKTESTPROOF_API_URL
- NEXT_PUBLIC_SITE_ORIGIN
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NITRO_PRESET=aws_amplify

Lister uniquement les noms configurés :

    aws amplify get-app --app-id d1ybxnm394w3bh --region eu-west-3 --query "keys(app.environmentVariables)" --output table

Ne jamais mettre dans le frontend une clé Stripe secrète, un secret webhook, une clé Supabase service_role, un bearer admin, une clé AWS ou un token GitHub.

## Quality gate locale

Depuis frontend :

    npm ci
    npm run lint
    npm test
    npm audit --omit=dev

PowerShell :

    $env:NITRO_PRESET="aws_amplify"
    npm run build:amplify
    npm run test:amplify
    git diff --check
    git status --short

Attendus :

- lint vert ;
- tous les tests verts ;
- zéro vulnérabilité de production ;
- .amplify-hosting/deploy-manifest.json présent ;
- test Amplify vert ;
- aucune donnée sensible ni artefact généré commité.

Les fichiers locaux .clinerules et DEPLOY_HANDOFF.md ne doivent pas être ajoutés automatiquement.

## Déploiement quotidien

1. Vérifier le commit :

       git status --short --branch
       git log -1 --format="%H %s"

2. Exécuter toute la quality gate.

3. Committer uniquement les fichiers prévus :

       git add <fichiers-validés>
       git commit -m "description claire"
       git push origin main

4. Suivre GitHub :

       gh run list --repo mathieusarrue-alt/stratverity --limit 6

5. Suivre Amplify :

       aws amplify list-jobs --app-id d1ybxnm394w3bh --branch-name main --region eu-west-3 --max-results 5

6. Vérifier qu'Amplify déploie exactement le SHA poussé.

7. Inspecter le job :

       aws amplify get-job --app-id d1ybxnm394w3bh --branch-name main --job-id <JOB_ID> --region eu-west-3

BUILD, DEPLOY et VERIFY doivent être SUCCEED. Les deux workflows GitHub doivent être verts.

## Recette avant DNS

Tester d'abord l'URL Amplify. Les routes suivantes doivent répondre 200 :

- /
- /configure
- /robots.txt
- /sitemap.xml
- /og.png
- /marketplace
- /score
- /crash-test
- /health-check
- /login

/cert peut répondre 307 vers son écran canonique.

Vérifier aussi :

- charte premium, thèmes et responsive mobile ;
- anglais par défaut et 12 langues ;
- connexion e-mail et OAuth Supabase ;
- configurateur Audit et Scan ;
- pricing issu de pricing.ts ;
- Checkpoint 14,99 EUR HT sur le périmètre prévu ;
- redirection Stripe uniquement vers checkout.stripe.com ;
- aucune activation avant webhook Stripe signé ;
- sitemap, robots, metadata et og.png ;
- pages légales et contact Prism Works.

Ne jamais effectuer un paiement réel pour une recette technique. Utiliser Stripe test ou demander une validation humaine explicite.

## Domaine et DNS

Ne changer le DNS que si la prévisualisation passe entièrement.

Lister l'association :

    aws amplify list-domain-associations --app-id d1ybxnm394w3bh --region eu-west-3

Créer l'association si nécessaire :

    aws amplify create-domain-association --app-id d1ybxnm394w3bh --domain-name stratverity.com --sub-domain-settings prefix=www,branchName=main prefix="",branchName=main --region eu-west-3

Puis :

1. sauvegarder les enregistrements Route 53 existants ;
2. ajouter les enregistrements de validation du certificat ;
3. attendre AVAILABLE ;
4. basculer www et l'apex ;
5. vérifier HTTPS, desktop et mobile ;
6. garder l'ancien hébergement disponible pendant la surveillance.

Ne jamais supprimer les enregistrements SES, DKIM, SPF, DMARC ou Supabase.

## Checklist publique

- www.stratverity.com répond 200 ;
- robots.txt, sitemap.xml et og.png répondent 200 ;
- la balise Google Search Console est présente ;
- /configure charge le bon pricing ;
- la preview API fonctionne ;
- Stripe crée une session et redirige vers checkout.stripe.com ;
- le retour reste en attente du webhook signé ;
- e-mail et OAuth fonctionnent ;
- aucune sonde technique n'est publiée ;
- Crash-Test et Marketplace API restent désactivées avant leur recette backend ;
- CloudWatch ne montre aucune erreur ;
- les SHA GitHub, Amplify et PROJECT_LOG.md correspondent.

## Logs

Groupe CloudWatch :

    /aws/amplify/d1ybxnm394w3bh

Commande :

    aws logs describe-log-streams --log-group-name /aws/amplify/d1ybxnm394w3bh --region eu-west-3 --order-by LastEventTime --descending --limit 5

Vérifier les en-têtes :

    curl.exe -sS -D - -o NUL https://www.stratverity.com/

Attendus : HSTS, CSP, nosniff, anti-framing, Referrer-Policy et aucun secret.

## Rollback

1. Identifier le dernier job Amplify sain.
2. Rétablir le code par un nouveau commit ou relancer le job sain.
3. Ne pas utiliser git reset --hard sur un poste partagé.
4. Si nécessaire, restaurer exactement le DNS sauvegardé.
5. Refaire la recette et documenter l'incident.

Un rollback frontend ne modifie jamais Stripe, Supabase, SES, les webhooks ou les secrets backend.

## Dépannage 502

- vérifier les fichiers statiques ;
- lire CloudWatch ;
- exécuter le bundle sous Node 22 Linux ;
- confirmer que scripts/patch-amplify-runtime.mjs a été exécuté ;
- lancer npm run test:amplify ;
- ne jamais basculer le DNS pendant un 502.

Amplify ne supporte pas le streaming Next.js. Le pont StratVerity matérialise les réponses et relaie seulement une liste blanche d'en-têtes. Toute mise à jour Nitro ou vinext doit conserver le test de non-régression.

## IAM minimal

Déploiement quotidien :

- amplify:GetApp
- amplify:GetBranch
- amplify:ListJobs
- amplify:GetJob
- amplify:StartJob si l'auto-build est désactivé
- logs:DescribeLogStreams
- logs:GetLogEvents

Séparer les droits Route 53 et domaine dans un rôle plus sensible. GitHub OIDC est recommandé. AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY sont seulement un fallback et ne doivent pas être créés si OIDC est disponible.
