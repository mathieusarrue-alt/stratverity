// Non-production placeholders keep local/static checks deterministic. Every
// deployed environment must provide the two NEXT_PUBLIC_SUPABASE_* variables.
const DEFAULT_SUPABASE_URL = "https://example.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_placeholder";

export const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL
).replace(/\/+$/, "");

// Publishable browser key: intentionally public. Authorization is enforced by
// Supabase Auth and RLS; secret/service-role keys must never be added here.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export type SocialProvider = "google" | "github" | "azure";

export async function getEnabledSocialProviders(): Promise<SocialProvider[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const settings = (await response.json()) as {
      external?: Partial<Record<SocialProvider, boolean>>;
    };
    return (["google", "github", "azure"] as const).filter(
      (provider) => settings.external?.[provider] === true,
    );
  } catch {
    return [];
  }
}
