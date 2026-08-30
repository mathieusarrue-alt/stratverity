import { requireSupabaseUser } from "../../supabase/server";
import TboProductClient from "./TboProductClient";

export default async function TopBottomOscillatorPage() {
  await requireSupabaseUser("/marketplace/top-bottom-oscillator");
  return <TboProductClient />;
}
