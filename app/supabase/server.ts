import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { safeReturnTo } from "./return-to";

export type StratVerityUser = {
  displayName: string;
  email: string;
  emailVerified: boolean;
};

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Route handlers can,
          // and refreshes are completed there.
        }
      },
    },
  });
}

export async function getSupabaseUser(): Promise<StratVerityUser | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const metadata = data.user.user_metadata as Record<string, unknown>;
  const candidate = metadata.full_name ?? metadata.name ?? metadata.user_name;
  const displayName =
    typeof candidate === "string" && candidate.trim()
      ? candidate.trim()
      : data.user.email;
  return {
    displayName,
    email: data.user.email,
    emailVerified: Boolean(data.user.email_confirmed_at),
  };
}

export async function requireSupabaseUser(returnTo: string) {
  const user = await getSupabaseUser();
  if (user) return user;
  redirect(`/login?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`);
}
