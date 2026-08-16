import { NextRequest, NextResponse } from "next/server";
import { safeReturnTo } from "../../supabase/return-to";
import { getSupabaseServerClient } from "../../supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("return_to"));
  if (!code) {
    return NextResponse.redirect(new URL("/login?auth_error=missing_code", request.url));
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?auth_error=callback", request.url));
  }
  return NextResponse.redirect(new URL(returnTo, request.url));
}
