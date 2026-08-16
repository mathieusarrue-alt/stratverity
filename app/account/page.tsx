import { requireSupabaseUser } from "../supabase/server";
import AccountContent from "./AccountContent";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireSupabaseUser("/account");
  return <AccountContent user={user} />;
}