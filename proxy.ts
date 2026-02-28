import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const IS_DEV = process.env.NODE_ENV !== "production";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "example.com";

const PROTECTED = new Set(["app", "dash"]);

function extractSubdomain(hostname: string): string {
  if (IS_DEV) {
    const host = hostname.split(":")[0];
    if (host === "localhost") return "root";
    return host.replace(".localhost", "");
  }
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`)
    return "root";
  return hostname.replace(`.${ROOT_DOMAIN}`, "");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|gif|ico|css|js)$).*)",
  ],
};

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname);
  const pathname = url.pathname; // original pathname e.g. /login or /

  const isAuthenticated = !!getSession();

  let rewriteBase: string;
  switch (subdomain) {
    case "root":
      rewriteBase = "/main";
      break;
    case "app":
      rewriteBase = "/app";
      break;
    case "dash":
      rewriteBase = "/dash";
      break;
    default:
      rewriteBase = `/tenant/${subdomain}`;
  }

  // ── Auth guard ───────────────────────────────────────────────────────────
  if (PROTECTED.has(subdomain) && !isAuthenticated) {
    const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

    if (!isLoginPage) {
      const rewriteUrl = new URL(`${rewriteBase}/login`, req.url);
      const res = NextResponse.rewrite(rewriteUrl);
      // ✅ Set ORIGINAL pathname, not the rewritten one
      res.headers.set("x-subdomain", subdomain);
      res.headers.set("x-pathname", "/login");
      return res;
    }
  }

  // ── Normal rewrite ───────────────────────────────────────────────────────
  const rewriteUrl = new URL(`${rewriteBase}${pathname}`, req.url);
  const res = NextResponse.rewrite(rewriteUrl);
  res.headers.set("x-subdomain", subdomain);
  res.headers.set("x-pathname", pathname); // ✅ always the original pathname
  return res;
}
