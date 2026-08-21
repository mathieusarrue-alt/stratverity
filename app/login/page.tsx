import { getEnabledSocialProviders } from "../supabase/config";
import { safeReturnTo } from "../supabase/return-to";
import { getSupabaseUser } from "../supabase/server";
import LoginContent from "./LoginContent";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ return_to?: string | string[]; auth_error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.return_to)
    ? params.return_to[0]
    : params.return_to;
  const rawAuthError = Array.isArray(params.auth_error)
    ? params.auth_error[0]
    : params.auth_error;
  const returnTo = safeReturnTo(rawReturnTo);
  const [user, enabledProviders] = await Promise.all([
    getSupabaseUser(),
    getEnabledSocialProviders(),
  ]);

  return (
    <LoginContent
      user={user}
      returnTo={returnTo}
      enabledProviders={enabledProviders}
      authError={rawAuthError ?? null}
    />
  );
}