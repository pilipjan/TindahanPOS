import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Use headers or hardcoded fallback to ensure we never redirect to internal IP (0.0.0.0)
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tindahan-pos.philipjohnn8nautomation.online";
  const origin = forwardedHost ? `${protocol}://${forwardedHost}` : siteUrl;

  console.log(`Auth callback: code=${!!code}, origin=${origin}, next=${next}`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log("Auth success! Redirecting to dashboard...");
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Supabase Auth Exchange Error:", error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}
