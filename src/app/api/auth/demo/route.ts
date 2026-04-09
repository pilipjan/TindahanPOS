import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  
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
