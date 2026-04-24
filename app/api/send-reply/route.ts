import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  esc,
  getClientIp,
  rateLimit,
  requireAdminFromBearer,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const throttle = await rateLimit(`send-reply:${ip}`, 10, 60_000);
  if (!throttle.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const auth = await requireAdminFromBearer(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);

  if (!body || !body.to || !body.replyBody) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const { to, toName, subject, replyBody } = body as {
    to: string;
    toName: string;
    subject: string;
    replyBody: string;
  };

  const safeTo = String(to).trim().toLowerCase();
  const safeToName = String(toName ?? "there").slice(0, 200);
  const safeSubject = String(subject ?? "").slice(0, 200);
  const safeReplyBody = String(replyBody ?? "").slice(0, 5000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTo)) {
    return NextResponse.json(
      { error: "Invalid recipient email." },
      { status: 400 },
    );
  }
  if (!safeReplyBody.trim()) {
    return NextResponse.json(
      { error: "Reply cannot be empty." },
      { status: 400 },
    );
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.",
      },
      { status: 503 },
    );
  }

  const htmlBody = safeReplyBody
    .split("\n")
    .map((line) =>
      line.trim() === ""
        ? "<br/>"
        : `<p style="margin:0 0 12px">${esc(line)}</p>`,
    )
    .join("");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"ProAssistNG Support" <${GMAIL_USER}>`,
      to: safeTo,
      subject: `Re: ${safeSubject || "Your enquiry"}`,
      text: `Hi ${safeToName || "there"},\n\n${safeReplyBody}\n\n—\nProAssistNG Support`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
          <p style="margin:0 0 12px">Hi ${esc(safeToName || "there")},</p>
          ${htmlBody}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
          <p style="font-size:12px;color:#6b7280">
            This message was sent from the ProAssistNG support team in response to your enquiry.
          </p>
        </div>`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
