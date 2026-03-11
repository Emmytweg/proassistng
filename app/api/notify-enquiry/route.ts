import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { senderName, senderEmail, freelancerName, messageBody } = body as {
    senderName: string;
    senderEmail?: string;
    freelancerName: string;
    messageBody: string;
  };

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    // Silently skip — don't block the user experience
    return NextResponse.json({ ok: true, skipped: true });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  await transporter
    .sendMail({
      from: `"ProAssistNG" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `New enquiry for ${freelancerName} from ${senderName}`,
      text: [
        `You have a new message on ProAssistNG.`,
        ``,
        `Freelancer: ${freelancerName}`,
        `From: ${senderName}${senderEmail ? ` <${senderEmail}>` : " (no email provided)"}`,
        ``,
        `Message:`,
        messageBody,
        ``,
        `—`,
        `View it in your admin dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/messages`,
      ].join("\n"),
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h2 style="margin:0 0 16px">New enquiry on ProAssistNG</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">Freelancer</td><td style="padding:6px 0;font-weight:600">${freelancerName}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">From</td><td style="padding:6px 0;font-weight:600">${senderName}${senderEmail ? ` &lt;${senderEmail}&gt;` : " <em>(no email provided)</em>"}</td></tr>
        </table>
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;line-height:1.7;white-space:pre-wrap">${messageBody}</div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/messages"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600">
          View in Admin Dashboard →
        </a>
        <p style="margin-top:24px;font-size:11px;color:#9ca3af">This is an automated notification from ProAssistNG.</p>
      </div>`,
    })
    .catch(() => {
      // Don't throw — email failure is non-critical
    });

  return NextResponse.json({ ok: true });
}
