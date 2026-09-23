import { NextResponse } from "next/server";
import { getMeteredConfig } from "@/lib/server-config";

export async function GET() {
  const { apiUrl, apiKey } = getMeteredConfig();

  if (!apiKey) {
    return NextResponse.json(
      { error: "TURN credentials are not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "TURN credentials could not be fetched." },
        { status: 502 },
      );
    }

    const iceServers = await response.json();
    return NextResponse.json(
      { iceServers },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { error: "TURN credentials could not be fetched." },
      { status: 502 },
    );
  }
}
