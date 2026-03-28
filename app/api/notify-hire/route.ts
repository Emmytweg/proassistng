import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateTransactionBreakdown } from "@/lib/payment-pricing";

// Escape HTML entities to prevent injection in email HTML body
function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // ── Validate & sanitise inputs ────────────────────────────────────────────
  const freelancerId = String(body.freelancerId ?? "").slice(0, 100);
  const freelancerName = String(body.freelancerName ?? "Unknown").slice(0, 200);
  const clientName = String(body.clientName ?? "Anonymous").slice(0, 200);
  const clientEmail = String(body.clientEmail ?? "").slice(0, 320);
  const projectTitle = String(body.projectTitle ?? "—").slice(0, 300);
  const category = String(body.category ?? "—").slice(0, 100);
  const description = String(body.description ?? "").slice(0, 2000);
  const startDate = String(body.startDate ?? "—").slice(0, 100);
  const duration = String(body.duration ?? "—").slice(0, 100);
  const commitment = String(body.commitment ?? "—").slice(0, 100);
  const requirements = String(body.requirements ?? "").slice(0, 2000);
  const txRef = String(body.txRef ?? "").slice(0, 200);
  const transactionId = String(body.transactionId ?? "").slice(0, 200);
  const amount = Math.max(0, Number(body.amount) || 0);
  const baseAmountRaw = Math.max(0, Number(body.baseAmount) || 0);
  const platformFeeRaw = Math.max(0, Number(body.platformFee) || 0);
  const fallback = calculateTransactionBreakdown(amount / 1.1);
  const baseAmount = baseAmountRaw > 0 ? baseAmountRaw : fallback.baseAmount;
  const platformFee =
    platformFeeRaw > 0 ? platformFeeRaw : fallback.platformFee;

  if (!freelancerId) {
    return NextResponse.json(
      { error: "Missing freelancerId." },
      { status: 400 },
    );
  }

  // ── 1. Insert into admin messages (Supabase) ──────────────────────────────
  try {
    const supabase = getSupabaseServerClient();
    await supabase.from("messages").insert({
      sender_name: clientName,
      sender_email: clientEmail || null,
      subject: `🤝 Hire request: "${projectTitle}" for ${freelancerName}`,
      body: [
        `New hire request received on ProAssistNG.`,
        ``,
        `Freelancer: ${freelancerName}`,
        `Client: ${clientName}${clientEmail ? ` <${clientEmail}>` : ""}`,
        ``,
        `Project: ${projectTitle}`,
        `Category: ${category}`,
        `Description: ${description}`,
        ``,
        `Start: ${startDate}  |  Duration: ${duration}  |  Hours: ${commitment}`,
        requirements ? `Requirements: ${requirements}` : "",
        ``,
        `Freelancer Amount: ₦${baseAmount.toLocaleString("en-NG")}`,
        `Platform Fee (10%): ₦${platformFee.toLocaleString("en-NG")}`,
        `Total Paid: ₦${amount.toLocaleString("en-NG")}`,
        ``,
        txRef ? `Paystack Ref: ${txRef}` : "",
        transactionId ? `Transaction ID: ${transactionId}` : "",
      ]
        .filter((l) => l !== "")
        .join("\n"),
      user_ref: freelancerId,
      unread: true,
      status: "open",
    });
  } catch {
    // DB failure is non-critical — still attempt email
  }

  // ── 2. Send Gmail notification ────────────────────────────────────────────
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return NextResponse.json({ ok: true, skipped: "email" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  await transporter
    .sendMail({
      from: `"ProAssistNG" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `💼 New hire request — ${esc(projectTitle)} (₦${amount.toLocaleString("en-NG")})`,
      text: [
        `New hire request on ProAssistNG.`,
        ``,
        `Freelancer: ${freelancerName}`,
        `Client: ${clientName}${clientEmail ? ` <${clientEmail}>` : ""}`,
        ``,
        `Project: ${projectTitle}`,
        `Category: ${category}`,
        `Description: ${description}`,
        ``,
        `Start: ${startDate} | Duration: ${duration} | Hours: ${commitment}`,
        requirements ? `Requirements: ${requirements}` : "",
        ``,
        `Freelancer Amount: ₦${baseAmount.toLocaleString("en-NG")}`,
        `Platform Fee (10%): ₦${platformFee.toLocaleString("en-NG")}`,
        `Total Paid: ₦${amount.toLocaleString("en-NG")}`,
        txRef ? `Paystack Ref: ${txRef}` : "",
        transactionId ? `Transaction ID: ${transactionId}` : "",
        ``,
        `View in admin: ${siteUrl}/admin/messages`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h2 style="margin:0 0 4px">💼 New Hire Request</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Received on ProAssistNG</p>

        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280;width:140px">Freelancer</td><td style="padding:8px 12px;font-weight:600">${esc(freelancerName)}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Client</td><td style="padding:8px 12px;font-weight:600">${esc(clientName)}${clientEmail ? ` &lt;${esc(clientEmail)}&gt;` : ""}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Project</td><td style="padding:8px 12px;font-weight:600">${esc(projectTitle)}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Category</td><td style="padding:8px 12px">${esc(category)}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Start</td><td style="padding:8px 12px">${esc(startDate)}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Duration</td><td style="padding:8px 12px">${esc(duration)}</td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Commitment</td><td style="padding:8px 12px">${esc(commitment)}</td></tr>
          ${requirements ? `<tr><td style="padding:8px 12px;color:#6b7280;vertical-align:top">Requirements</td><td style="padding:8px 12px">${esc(requirements)}</td></tr>` : ""}
        </table>

        ${description ? `<div style="background:#f9fafb;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.7;margin-bottom:20px"><strong>Description</strong><br>${esc(description)}</div>` : ""}

        <div style="background:#111;color:#fff;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:20px">
          <p style="margin:0;font-size:12px;opacity:0.7;text-transform:uppercase;letter-spacing:0.05em">Total Paid</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:900">₦${amount.toLocaleString("en-NG")}</p>
          <p style="margin:8px 0 0;font-size:12px;opacity:0.8">Freelancer: ₦${baseAmount.toLocaleString("en-NG")} · Fee (10%): ₦${platformFee.toLocaleString("en-NG")}</p>
        </div>

        ${
          txRef || transactionId
            ? `
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
          ${txRef ? `<tr><td style="padding:6px 0;color:#6b7280">Tx Ref</td><td style="padding:6px 0;font-family:monospace">${esc(txRef)}</td></tr>` : ""}
          ${transactionId ? `<tr><td style="padding:6px 0;color:#6b7280">Transaction ID</td><td style="padding:6px 0;font-family:monospace">${esc(String(transactionId))}</td></tr>` : ""}
        </table>`
            : ""
        }

        <a href="${esc(siteUrl)}/admin/messages"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600">
          View in Admin Dashboard →
        </a>
        <p style="margin-top:24px;font-size:11px;color:#9ca3af">This is an automated notification from ProAssistNG.</p>
      </div>`,
    })
    .catch(() => {
      // Email failure is non-critical
    });

  return NextResponse.json({ ok: true });
}
