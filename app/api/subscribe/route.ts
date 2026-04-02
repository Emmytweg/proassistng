import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const throttle = rateLimit(`subscribe:${ip}`, 8, 60_000);
  if (!throttle.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();

  // Check for duplicate
  const { data: existing } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You're already subscribed!" },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("subscribers").insert({ email });

  if (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
