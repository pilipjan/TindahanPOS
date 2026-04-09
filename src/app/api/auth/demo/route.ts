import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Cloudflare Tunnel / Nginx reverse proxy: read real public origin from headers.
  // Priority: x-forwarded-host → host header → NEXT_PUBLIC_SITE_URL → request.url
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : hostHeader
    ? `${forwardedProto}://${hostHeader}`
    : (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin);

  const response = NextResponse.redirect(new URL("/dashboard", origin));
  
  // Set the guest cookie for 24 hours
  response.cookies.set("tindahan_guest", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  
  return response;
}
