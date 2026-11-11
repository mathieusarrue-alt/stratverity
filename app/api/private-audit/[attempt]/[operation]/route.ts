import { proxyPrivateAudit } from "../../bridge";
import { getSupabaseServerClient } from "../../../../supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ attempt: string; operation: string }> }) {
  const { attempt, operation } = await params;
  return proxyPrivateAudit(request, attempt, operation, {
    development: process.env.NODE_ENV === "development",
    enabled: process.env.STRATVERITY_PRIVATE_AUDIT_LOCAL === "1",
    site: process.env.STRATVERITY_PRIVATE_AUDIT_SITE,
    upstream: process.env.STRATVERITY_PRIVATE_AUDIT_UPSTREAM,
    readToken: async () => {
      // This is transport only. The private FastAPI route verifies the token
      // with Supabase before reading its request body or selecting an owner.
      const { data, error } = await (await getSupabaseServerClient()).auth.getSession();
      return error ? undefined : data.session?.access_token;
    },
  });
}
