import { requireSupabaseUser } from "../supabase/server";
import AdminReviewConsole from "./review-console";

export default async function AdminPage() {
  await requireSupabaseUser("/admin");
  return <AdminReviewConsole />;
}