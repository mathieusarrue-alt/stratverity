export const SUPABASE_URL = "https://qxeylhrjelywtjoswyni.supabase.co";

// Publishable browser key: intentionally public. Authorization is enforced by
// Supabase Auth and RLS; secret/service-role keys must never be added here.
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fV9OeuxQQ5TjS-1T4DFPQw_iaX2NgT6";

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
