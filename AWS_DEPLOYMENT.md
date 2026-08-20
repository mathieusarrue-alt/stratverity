# AWS frontend deployment — StratVerity

## Decision

Status: **prepared, not activated**.

- **REUSE** AWS Amplify Hosting because it provides CloudFront, TLS, SSR
  compute, branch releases and logs.
- **ADAPT** the existing vinext build with the official Nitro Vite adapter and
  the aws_amplify preset.
- **REJECT** a plain S3 static deployment: StratVerity uses SSR, dynamic routes,
  Supabase authentication callbacks and protected account/admin pages.
- **DEFER** the DNS switch from OpenAI Sites until an Amplify preview passes the
  complete production smoke test.

The repository now contains amplify.yml, .github/workflows/deploy-aws.yml and a
dual target in vite.config.ts. The existing Sites/Cloudflare build remains
unchanged; Amplify builds use Nitro.

## One-time AWS Amplify setup

1. Create an Amplify Hosting app connected to
   mathieusarrue-alt/stratverity.
2. Select branch main, runtime Node.js 22 and platform WEB_COMPUTE.
3. Let Amplify use the repository amplify.yml.
4. Disable Amplify's automatic repository build trigger if GitHub Actions will
   call StartJob; keeping both would create duplicate builds.
5. Add the public frontend environment values already used in production:
   NEXT_PUBLIC_BACKTESTPROOF_API_URL, NEXT_PUBLIC_SUPABASE_URL and
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Never put Stripe or backend secrets
   in the frontend.
6. Validate the temporary Amplify hostname before changing Route 53.

## GitHub repository configuration

Repository variables:

- AWS_REGION=eu-west-3
- AWS_DEPLOY_ENABLED=false during preview; set to true only after approval.
- AWS_ROLE_TO_ASSUME=<role ARN> with the recommended OIDC method.

Repository secrets:

- AWS_AMPLIFY_APP_ID
- fallback only: AWS_ACCESS_KEY_ID
- fallback only: AWS_SECRET_ACCESS_KEY

GitHub environment:

- Create production.
- Optional but recommended: require a human reviewer until the first three
  production deployments have succeeded.

## Recommended authentication: GitHub OIDC

OIDC provides short-lived credentials and avoids storing permanent AWS keys.
Restrict the trust policy to this exact repository and main:

    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::467866783258:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": "repo:mathieusarrue-alt/stratverity:ref:refs/heads/main"
          }
        }
      }]
    }

Minimal permission policy; replace AMPLIFY_APP_ID:

    {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": [
          "amplify:StartJob",
          "amplify:GetJob"
        ],
        "Resource": "arn:aws:amplify:eu-west-3:467866783258:apps/AMPLIFY_APP_ID/branches/main/jobs/*"
      }]
    }

If OIDC is not available yet, create a dedicated IAM user with only this policy
and put its two keys in the GitHub secrets named above. Do not reuse an
administrator or EC2 access key.

## Activation and rollback

1. Keep AWS_DEPLOY_ENABLED=false.
2. Run the workflow and confirm the quality job, including the
   .amplify-hosting bundle.
3. Create the Amplify app and add its ID.
4. Set AWS_DEPLOY_ENABLED=true, run the workflow and test the Amplify URL.
5. Verify /, /robots.txt, /sitemap.xml, /marketplace, /score, /crash-test,
   /health-check, /cert, /login and /configure.
6. Verify login/OAuth callbacks, one Stripe test checkout and the signed webhook
   path before moving the custom domain.
7. Lower DNS TTL, switch Route 53, monitor, then keep the former Sites version
   available for rollback.

Rollback is a redeploy of the last successful Amplify job or a temporary DNS
return to the last successful OpenAI Sites deployment. Never roll back the
frontend by changing Stripe, Supabase or backend secrets.

## Security gates

- No secret in Git, build output or browser bundle.
- npm ci, npm run lint, npm test and npm audit --omit=dev must pass.
- The deployed commit SHA must match GitHub main.
- Do not activate AWS or change DNS until the preview smoke test passes.
