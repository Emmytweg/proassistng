import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceRedirectUrl } from "@/lib/server-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!projectId || !email) {
      return NextResponse.json(
        { error: "Missing workspace or email." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data: workspace, error: workspaceError } = await supabase
      .from("project_workspaces")
      .select("id, client_email")
      .eq("id", projectId)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 },
      );
    }

    if (
      workspace.client_email &&
      workspace.client_email.toLowerCase() !== email
    ) {
      return NextResponse.json(
        { error: "This email is not authorized for this workspace." },
        { status: 403 },
      );
    }

    const redirectTo = getWorkspaceRedirectUrl(projectId);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Magic link request failed." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid workspace magic-link request." },
      { status: 400 },
    );
  }
}
