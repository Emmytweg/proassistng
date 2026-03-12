import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  MapPin,
  Briefcase,
  ExternalLink,
  ArrowLeft,
  Phone,
  Clock,
} from "lucide-react";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { serviceCategories } from "@/lib/services";
import ContactForm from "./contact-form";
import HireFlow from "./hire-flow";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRate(
  hourlyRate: number | null,
  rateType: string | null,
): string {
  if (hourlyRate == null) return "Contact for rate";
  const amt = `₦${hourlyRate.toLocaleString("en-NG")}`;
  if (rateType === "milestone") return `${amt}/milestone`;
  if (rateType === "contract") return `${amt} (contract)`;
  return `${amt}/hr`;
}

export const dynamic = "force-dynamic";

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseServerClient();
  const { data: r, error } = await supabase
    .from("freelancers")
    .select(
      "id, full_name, title, location, experience, hourly_rate, rate_type, portfolio_url, phone_number, bio, skills, service_slugs, featured, photo_url, status",
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !r) notFound();

  const skills: string[] = Array.isArray(r.skills) ? r.skills.map(String) : [];
  const serviceSlugs: string[] = Array.isArray(r.service_slugs)
    ? r.service_slugs.map(String)
    : [];
  const matchedServices = serviceCategories.filter((c) =>
    serviceSlugs.includes(c.slug),
  );

  const rate = formatRate(r.hourly_rate, r.rate_type);
  const whatsappNumber = r.phone_number
    ? r.phone_number.replace(/\D/g, "").replace(/^0/, "234")
    : null;

  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-10 pt-24">
        {/* Back */}
        <Link
          href="/browse-talents"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Browse Talents
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {r.photo_url ? (
                    <Image
                      src={r.photo_url}
                      alt={r.full_name}
                      width={96}
                      height={96}
                      className="rounded-2xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-md">
                      {getInitials(r.full_name)}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-green-500 ring-2 ring-card">
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                  </span>
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight">
                      {r.full_name}
                    </h1>
                    <span className="inline-flex items-center justify-center rounded-full border bg-background p-0.5 text-primary">
                      <BadgeCheck className="size-5" aria-label="Verified" />
                    </span>
                    {r.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 text-yellow-600 text-xs font-bold px-3 py-0.5">
                        ★ Top Rated
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-base font-semibold text-primary">
                    {r.title ?? "Freelancer"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {r.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4 shrink-0" />
                        {r.location}
                      </span>
                    )}
                    {r.experience && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4 shrink-0" />
                        {r.experience} experience
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Briefcase className="size-4 shrink-0" />
                      {rate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            {r.bio && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {r.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">
                  Skills &amp; Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-xs px-3 py-1"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {matchedServices.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Services Offered</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {matchedServices.map((svc) => (
                    <Link
                      key={svc.slug}
                      href={`/services/${svc.slug}`}
                      className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <svc.icon className="size-4 shrink-0 text-primary" />
                      {svc.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* Rate card */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm text-center">
              <div className="mt-4 flex flex-col gap-2">
                <HireFlow
                  freelancerId={r.id}
                  freelancerName={r.full_name}
                  freelancerTitle={r.title ?? "Freelancer"}
                  freelancerRate={rate}
                />
                <a
                  href="#contact"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Contact {r.full_name.split(" ")[0]}
                </a>
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-green-50 text-green-700 border-green-200 px-4 py-2.5 text-sm font-semibold hover:bg-green-100 transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-4"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.108.551 4.086 1.515 5.808L.057 23.885a.75.75 0 0 0 .921.921l6.115-1.457A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.073-1.38l-.361-.214-3.735.89.905-3.698-.234-.381A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
                {r.portfolio_url && (
                  <a
                    href={r.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
                  >
                    <ExternalLink className="size-4" />
                    View Portfolio
                  </a>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3 text-sm">
              {r.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <span>{r.phone_number}</span>
                </div>
              )}
              {r.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span>{r.location}</span>
                </div>
              )}
              {r.experience && (
                <div className="flex items-center gap-3">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span>{r.experience} of experience</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTACT FORM ── */}
        <div id="contact" className="mt-12 scroll-mt-24">
          <ContactForm freelancerId={r.id} freelancerName={r.full_name} />
        </div>
      </div>

      <Footer />
    </main>
  );
}
