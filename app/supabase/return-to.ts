const RESERVED_PATHS = new Set(["/login", "/auth/callback", "/auth/signout"]);

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local" || RESERVED_PATHS.has(url.pathname)) {
      return "/account";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}
