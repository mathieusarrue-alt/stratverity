import { requireSupabaseUser } from "../supabase/server";

// /account* est un espace connecté : login requis sur toutes les sous-routes.
export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSupabaseUser("/account");
  return <>{children}</>;
}
