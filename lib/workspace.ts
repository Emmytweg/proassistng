import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceRedirectUrl } from "@/lib/server-config";

export type ProjectWorkspaceInput = {
  txRef?: string;
  paymentId?: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail?: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  serviceTitle?: string;
  description?: string;
  requirements?: string;
  amount?: number;
  status?: string;
};

export async function createProjectWorkspaceForHire(
  input: ProjectWorkspaceInput,
) {
  const supabase = getSupabaseAdminClient();

  const clientEmail = String(input.clientEmail ?? "")
    .trim()
    .toLowerCase();
  const title = String(
    input.projectTitle || input.serviceTitle || "Project",
  ).trim();
  const txRef = String(input.txRef ?? "").trim();
  const freelancerId = String(input.freelancerId ?? "").trim();

  if (!freelancerId || !clientEmail) {
    return {
      projectId: null,
      created: false,
      reason: "missing_freelancer_or_email",
    };
  }

  const basePayload = {
    tx_ref: txRef || null,
    payment_id: input.paymentId ?? null,
    freelancer_id: freelancerId,
    freelancer_name: String(input.freelancerName || "Freelancer").slice(0, 200),
    freelancer_email: String(input.freelancerEmail ?? "").trim().toLowerCase() || null,
    client_name: String(input.clientName || "Client").slice(0, 200),
    client_email: clientEmail,
    title: title.slice(0, 220),
    description: String(input.description ?? "").slice(0, 4000),
    requirements: String(input.requirements ?? "").slice(0, 4000),
    status: String(input.status ?? "pending").slice(0, 60),
    amount: Number(input.amount ?? 0),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = txRef
    ? await supabase
        .from("project_workspaces")
        .select("id, freelancer_email")
        .eq("tx_ref", txRef)
        .maybeSingle()
    : await supabase
        .from("project_workspaces")
      .select("id, freelancer_email")
        .eq("freelancer_id", freelancerId)
        .eq("client_email", clientEmail)
        .eq("title", title)
        .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existing?.id) {
    const freelancerEmail = String(input.freelancerEmail ?? "")
      .trim()
      .toLowerCase();
    if (freelancerEmail && existing.freelancer_email !== freelancerEmail) {
      await supabase
        .from("project_workspaces")
        .update({ freelancer_email: freelancerEmail, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return { projectId: existing.id, created: false, reason: "existing" };
  }

  const { data, error } = await supabase
    .from("project_workspaces")
    .insert(basePayload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("project_activity").insert({
    project_id: data.id,
    action: "workspace_created",
    metadata: {
      client_name: basePayload.client_name,
      freelancer_name: basePayload.freelancer_name,
      amount: basePayload.amount,
      tx_ref: txRef || null,
    },
  });

  return { projectId: data.id, created: true, reason: "created" };
}

export function getWorkspaceUrl(projectId: string) {
  return getWorkspaceRedirectUrl(projectId);
}

export async function findProjectWorkspaceByTxRef(txRef: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_workspaces")
    .select("id, title, client_email, freelancer_name, status")
    .eq("tx_ref", txRef)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

export async function findFreelancerEmail(freelancerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("freelancers")
    .select("email")
    .eq("id", freelancerId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return String(data?.email ?? "").trim().toLowerCase();
}

export async function sendWorkspaceMagicLink(projectId: string, email: string) {
  const supabase = getSupabaseAdminClient();
  const redirectTo = getWorkspaceUrl(projectId);

  const { error } = await supabase.auth.signInWithOtp({
    email: String(email).trim(),
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  return { ok: !error, error };
}
