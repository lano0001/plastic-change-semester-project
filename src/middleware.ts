import type { MiddlewareHandler } from "astro";

// Credentials (use env vars in prod)
const USER = "studerende";
const PASS = "kea2025";
const COOKIE = "pc_auth"; // cookie name

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const req = ctx.request;
  const url = new URL(req.url);
  const path = url.pathname;

  // Always allow login endpoints & static/astro assets
  const isLoginPath =
    path.startsWith("/login") ||
    path.startsWith("/api/login") ||
    path.startsWith("/api/logout");
  const isStatic =
    /\.(js|css|map|png|jpg|jpeg|webp|svg|ico|json|txt|woff2)$/i.test(path);
  const isAstro = path.startsWith("/_astro") || path.startsWith("/@fs");
  const isApi =
    path.startsWith("/api/") &&
    !path.startsWith("/api/login") &&
    !path.startsWith("/api/logout");

  if (isLoginPath || isStatic || isAstro || isApi) return next();

  // Only guard document navigations (HTML pages)
  const dest = (req.headers.get("sec-fetch-dest") || "").toLowerCase();
  const accept = (req.headers.get("accept") || "").toLowerCase();
  const isDoc = dest === "document" || accept.includes("text/html");
  if (!isDoc) return next();

  // Already authenticated?
  const cookie = req.headers.get("cookie") || "";
  const ok = cookie.split(/;\s*/).some((c) => c.startsWith(`${COOKIE}=`));
  if (ok) return next();

  // Redirect to login with ?next=
  const nextUrl = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(`${url.origin}/login?next=${nextUrl}`, 302);
};
