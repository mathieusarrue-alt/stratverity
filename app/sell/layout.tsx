import { requireSupabaseUser } from "../supabase/server";

// /sell* (et sous-routes) exigent un compte connecté.
export const dynamic = "force-dynamic";

export default async function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSupabaseUser("/sell");
  return <>{children}</>;
}
