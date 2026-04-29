import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { esc, getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const throttle = await rateLimit(`notify-contact:${ip}`, 12, 60_000);
  if (!throttle.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const senderName = String(body.senderName ?? "").slice(0, 200);
  const senderEmail = body.senderEmail
    ? String(body.senderEmail).slice(0, 320)
    : undefined;
  const subject = String(body.subject ?? "General inquiry").slice(0, 200);
  const messageBody = String(body.messageBody ?? "").slice(0, 5000);

  if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return NextResponse.json(
      { error: "Invalid sender email." },
      { status: 400 },
    );
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
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
      subject: `New Contact Form Message: ${subject}`,
      text: [
        `You have a new message on ProAssistNG Contact Form.`,
        ``,
        `From: ${senderName}${senderEmail ? ` <${senderEmail}>` : " (no email provided)"}`,
        `Subject: ${subject}`,
        ``,
        `Message:`,
        messageBody,
        ``,
        `—`,
        `View it in your admin dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/messages`,
      ].join("\n"),
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h2 style="margin:0 0 16px">New message on ProAssistNG Contact Form</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">From</td><td style="padding:6px 0;font-weight:600">${esc(senderName)}${senderEmail ? ` &lt;${esc(senderEmail)}&gt;` : " <em>(no email provided)</em>"}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap">Subject</td><td style="padding:6px 0;font-weight:600">${esc(subject)}</td></tr>
        </table>
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(messageBody)}</div>
        <a href="${esc(process.env.NEXT_PUBLIC_SITE_URL ?? "")}/admin/messages"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600">
          View in Admin Dashboard →
        </a>
      </div>`,
    })
    .catch((err) => {
      console.error("NODEMAILER ERROR (notify-contact):", err);
    });

  return NextResponse.json({ ok: true });
}