"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Camera,
  Link as LinkIcon,
  MapPin,
  Pencil,
  Tag,
  User,
  Briefcase,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  PRESET_RATE_TYPES,
  getRateSuffix,
  normalizeRateType,
} from "@/lib/rate-format";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { serviceCategories } from "@/lib/services";

type ExperienceOption =
  | ""
  | "1-2 years"
  | "3-5 years"
  | "5-8 years"
  | "8+ years";

type RateType = string;
type PresetRateType = (typeof PRESET_RATE_TYPES)[number];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT (Abuja)",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const RATE_TYPE_OPTIONS: {
  value: PresetRateType;
  label: string;
  suffix: string;
}[] = [
  { value: "hourly", label: "Per Hour", suffix: "/hr" },
  { value: "monthly", label: "Per Month", suffix: "/month" },
  { value: "milestone", label: "Per Milestone", suffix: "/milestone" },
  { value: "contract", label: "Contract Based", suffix: " (contract)" },
];

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  "",
  "1-2 years",
  "3-5 years",
  "5-8 years",
  "8+ years",
];

type ImportFieldKey =
  | "full_name"
  | "title"
  | "location"
  | "experience"
  | "hourly_rate"
  | "hourly_rate_min"
  | "hourly_rate_max"
  | "rate_type"
  | "portfolio_url"
  | "phone_number"
  | "bio"
  | "skills"
  | "service_slugs"
  | "featured"
  | "status";

const IMPORT_FIELD_ALIASES: Record<string, ImportFieldKey> = {
  fullname: "full_name",
  full_name: "full_name",
  name: "full_name",
  displayname: "full_name",
  title: "title",
  professionaltitle: "title",
  role: "title",
  location: "location",
  state: "location",
  address: "location",
  experience: "experience",
  yearsofexperience: "experience",
  experiencelvl: "experience",
  hourlyrate: "hourly_rate",
  rate: "hourly_rate",
  price: "hourly_rate",
  amount: "hourly_rate",
  minimumrate: "hourly_rate_min",
  minrate: "hourly_rate_min",
  ratemin: "hourly_rate_min",
  lowestprice: "hourly_rate_min",
  maximumrate: "hourly_rate_max",
  maxrate: "hourly_rate_max",
  ratemax: "hourly_rate_max",
  highestprice: "hourly_rate_max",
  ratetype: "rate_type",
  paymenttype: "rate_type",
  billingtype: "rate_type",
  portfolio: "portfolio_url",
  portfoliourl: "portfolio_url",
  website: "portfolio_url",
  url: "portfolio_url",
  phone: "phone_number",
  phonenumber: "phone_number",
  mobile: "phone_number",
  contactnumber: "phone_number",
  bio: "bio",
  about: "bio",
  description: "bio",
  skills: "skills",
  expertise: "skills",
  tags: "skills",
  services: "service_slugs",
  service: "service_slugs",
  servicecategories: "service_slugs",
  serviceslugs: "service_slugs",
  featured: "featured",
  toprated: "featured",
  status: "status",
  profilestatus: "status",
};

function normalizeImportKey(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "")
    .trim();
}

function resolveImportField(rawKey: string): ImportFieldKey | null {
  const normalized = normalizeImportKey(rawKey);
  return IMPORT_FIELD_ALIASES[normalized] ?? null;
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(/[\n,;|]/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseExperience(value: unknown): ExperienceOption | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return EXPERIENCE_OPTIONS.includes(text as ExperienceOption)
    ? (text as ExperienceOption)
    : null;
}

function parseRateType(value: unknown): RateType | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const normalized = normalizeRateType(text);
  if (normalized.includes("month")) return "monthly";
  if (normalized.includes("mile")) return "milestone";
  if (normalized.includes("contract")) return "contract";
  if (
    normalized.includes("hour") ||
    normalized === "hr" ||
    normalized === "hourly"
  ) {
    return "hourly";
  }

  return normalized;
}

function parseBoolean(value: unknown): boolean | null {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  if (["true", "yes", "1", "on", "enabled"].includes(text)) return true;
  if (["false", "no", "0", "off", "disabled"].includes(text)) return false;
  return null;
}

function parseStatus(value: unknown): "active" | "inactive" | null {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  if (text === "active") return "active";
  if (text === "inactive") return "inactive";
  return null;
}

function parseTextRecord(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
      return parsed[0] as Record<string, unknown>;
    }
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to key-value / delimited parsing.
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return {};

  const delimiter = lines[0]?.includes("\t") ? "\t" : ",";
  if (lines.length > 1 && lines[0]?.includes(delimiter)) {
    const headers = lines[0].split(delimiter).map((h) => h.trim());
    const values = lines[1].split(delimiter).map((v) => v.trim());
    const record: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      if (!header) return;
      record[header] = values[i] ?? "";
    });
    if (Object.keys(record).length > 0) return record;
  }

  const keyValueRecord: Record<string, unknown> = {};
  for (const line of lines) {
    const match = line.match(/^([^:=\-]+)\s*[:=\-]\s*(.+)$/);
    if (!match) continue;
    keyValueRecord[match[1].trim()] = match[2].trim();
  }
  return keyValueRecord;
}

async function parseImportFile(file: File): Promise<Record<string, unknown>> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) return {};

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
      raw: false,
    });
    if (rows.length > 0) return rows[0] ?? {};

    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, {
      header: 1,
      raw: false,
    });
    if (matrix.length >= 2) {
      const headers = (matrix[0] ?? []).map((v) => String(v ?? "").trim());
      const values = (matrix[1] ?? []).map((v) => String(v ?? "").trim());
      const record: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        if (!header) return;
        record[header] = values[i] ?? "";
      });
      return record;
    }
    return {};
  }

  const text = await file.text();
  return parseTextRecord(text);
}

function mapToServiceSlugs(value: unknown): string[] {
  const parts = parseStringList(value);
  const slugByNormalizedTitle = new Map(
    serviceCategories.map((s) => [normalizeImportKey(s.title), s.slug]),
  );
  const validSlugs = new Set(serviceCategories.map((s) => s.slug));

  const slugs = parts
    .map((part) => {
      const normalized = normalizeImportKey(part);
      if (validSlugs.has(part)) return part;
      if (validSlugs.has(normalized)) return normalized;
      return slugByNormalizedTitle.get(normalized) ?? null;
    })
    .filter((s): s is string => !!s);

  return Array.from(new Set(slugs));
}

function useReveal() {
  const reduceMotion = useReducedMotion();

  return useMemo(
    () =>
      ({
        fadeUp: {
          hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" },
          },
        },
        stagger: {
          hidden: {},
          show: {
            transition: {
              staggerChildren: reduceMotion ? 0 : 0.06,
              delayChildren: reduceMotion ? 0 : 0.02,
            },
          },
        },
      }) as const,
    [reduceMotion],
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

function InputShell({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
      {children}
    </div>
  );
}

export type FreelancerInitialData = {
  full_name: string;
  title: string | null;
  location: string | null;
  experience: ExperienceOption;
  hourly_rate: number | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  rate_type: string;
  portfolio_url: string | null;
  phone_number: string | null;
  bio: string | null;
  skills: string[];
  service_slugs: string[];
  featured: boolean;
  photo_url: string | null;
  status: string;
};

export default function FreelancerForm({
  initialData,
  freelancerId,
}: {
  initialData?: FreelancerInitialData;
  freelancerId?: string;
}) {
  const { fadeUp, stagger } = useReveal();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photo_url ?? null,
  );

  const [fullName, setFullName] = useState(initialData?.full_name ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [experience, setExperience] = useState<ExperienceOption>(
    initialData?.experience ?? "",
  );
  const [hourlyRate, setRate] = useState(
    initialData?.hourly_rate != null ? String(initialData.hourly_rate) : "",
  );
  const [hourlyRateMin, setHourlyRateMin] = useState(
    initialData?.hourly_rate_min != null
      ? String(initialData.hourly_rate_min)
      : initialData?.hourly_rate != null
        ? String(initialData.hourly_rate)
        : "",
  );
  const [hourlyRateMax, setHourlyRateMax] = useState(
    initialData?.hourly_rate_max != null
      ? String(initialData.hourly_rate_max)
      : initialData?.hourly_rate != null
        ? String(initialData.hourly_rate)
        : "",
  );
  const [rateType, setRateType] = useState<RateType>(
    normalizeRateType(initialData?.rate_type) || "hourly",
  );
  const [portfolio, setPortfolio] = useState(initialData?.portfolio_url ?? "");
  const [phone, setPhone] = useState(initialData?.phone_number ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [activeStatus, setActiveStatus] = useState(
    initialData?.status ?? "active",
  );

  const [skills, setSkills] = useState<string[]>(
    initialData?.skills?.length
      ? initialData.skills
      : ["UI Design", "React.js", "Figma"],
  );
  const [serviceSlugs, setServiceSlugs] = useState<string[]>(
    initialData?.service_slugs ?? [],
  );
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyImportedValues = (record: Record<string, unknown>) => {
    let updated = 0;

    for (const [rawKey, rawValue] of Object.entries(record)) {
      const field = resolveImportField(rawKey);
      if (!field) continue;

      switch (field) {
        case "full_name": {
          const next = String(rawValue ?? "").trim();
          if (!next) break;
          setFullName(next);
          updated += 1;
          break;
        }
        case "title": {
          const next = String(rawValue ?? "").trim();
          if (!next) break;
          setTitle(next);
          updated += 1;
          break;
        }
        case "location": {
          const next = String(rawValue ?? "").trim();
          if (!next) break;
          setLocation(next);
          updated += 1;
          break;
        }
        case "experience": {
          const next = parseExperience(rawValue);
          if (!next) break;
          setExperience(next);
          updated += 1;
          break;
        }
        case "hourly_rate": {
          const next = Number.parseFloat(
            String(rawValue ?? "").replace(/,/g, ""),
          );
          if (!Number.isFinite(next)) break;
          setRate(String(next));
          setHourlyRateMin(String(next));
          setHourlyRateMax(String(next));
          updated += 1;
          break;
        }
        case "hourly_rate_min": {
          const next = Number.parseFloat(
            String(rawValue ?? "").replace(/,/g, ""),
          );
          if (!Number.isFinite(next)) break;
          setHourlyRateMin(String(next));
          updated += 1;
          break;
        }
        case "hourly_rate_max": {
          const next = Number.parseFloat(
            String(rawValue ?? "").replace(/,/g, ""),
          );
          if (!Number.isFinite(next)) break;
          setHourlyRateMax(String(next));
          updated += 1;
          break;
        }
        case "rate_type": {
          const next = parseRateType(rawValue);
          if (!next) break;
          setRateType(next);
          updated += 1;
          break;
        }
        case "portfolio_url": {
          const next = String(rawValue ?? "").trim();
          if (!next) break;
          setPortfolio(next);
          updated += 1;
          break;
        }
        case "phone_number": {
          const next = String(rawValue ?? "")
            .replace(/[^\d\s+\-()]/g, "")
            .trim();
          if (!next) break;
          setPhone(next);
          updated += 1;
          break;
        }
        case "bio": {
          const next = String(rawValue ?? "").trim();
          if (!next) break;
          setBio(next);
          updated += 1;
          break;
        }
        case "skills": {
          const next = parseStringList(rawValue);
          if (next.length === 0) break;
          setSkills(Array.from(new Set(next)));
          updated += 1;
          break;
        }
        case "service_slugs": {
          const next = mapToServiceSlugs(rawValue);
          if (next.length === 0) break;
          setServiceSlugs(next);
          updated += 1;
          break;
        }
        case "featured": {
          const next = parseBoolean(rawValue);
          if (next == null) break;
          setFeatured(next);
          updated += 1;
          break;
        }
        case "status": {
          const next = parseStatus(rawValue);
          if (!next) break;
          setActiveStatus(next);
          updated += 1;
          break;
        }
      }
    }

    return updated;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Page header */}
      <motion.div variants={fadeUp} className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest">
          <BadgeCheck className="h-4 w-4" />
          {freelancerId ? "Profile update" : "Marketplace onboarding"}
        </div>
        <h3 className="text-3xl font-black text-foreground">
          {freelancerId
            ? "Edit Freelancer Profile"
            : "Create Professional Profile"}
        </h3>
        <p className="text-muted-foreground">
          {freelancerId
            ? "Update the details below to modify this freelancer's listing."
            : "Fill in the details below to list a new freelancer on the ProAssistNG platform."}
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={fadeUp}
        className="bg-card rounded-2xl shadow-xl shadow-black/5 border overflow-hidden"
      >
        <form
          onSubmit={(e) => {
            (async () => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);

              try {
                const supabase = getSupabaseBrowserClient();

                // Upload photo to Supabase Storage if a file was selected
                let uploadedPhotoUrl: string | null =
                  initialData?.photo_url ?? null;
                if (photoFile) {
                  const ext = photoFile.name.split(".").pop() ?? "jpg";
                  const fileName = `${crypto.randomUUID()}.${ext}`;
                  const { error: uploadError, data: uploadData } =
                    await supabase.storage
                      .from("freelancer-photos")
                      .upload(fileName, photoFile, { upsert: false });
                  if (uploadError) throw uploadError;
                  const { data: urlData } = supabase.storage
                    .from("freelancer-photos")
                    .getPublicUrl(uploadData.path);
                  uploadedPhotoUrl = urlData.publicUrl;
                }

                const hourly = Number.parseFloat(hourlyRate);
                const parsedMin = Number.parseFloat(hourlyRateMin);
                const parsedMax = Number.parseFloat(hourlyRateMax);
                const fallback = Number.isFinite(hourly) ? hourly : null;
                const rawMin = Number.isFinite(parsedMin)
                  ? parsedMin
                  : fallback;
                const rawMax = Number.isFinite(parsedMax)
                  ? parsedMax
                  : fallback;
                const normalizedMin =
                  rawMin != null && rawMax != null
                    ? Math.min(rawMin, rawMax)
                    : rawMin;
                const normalizedMax =
                  rawMin != null && rawMax != null
                    ? Math.max(rawMin, rawMax)
                    : rawMax;
                const payload = {
                  full_name: fullName.trim() || "Unnamed",
                  title: title.trim() || null,
                  location: location.trim() || null,
                  experience: experience || null,
                  hourly_rate: normalizedMin,
                  hourly_rate_min: normalizedMin,
                  hourly_rate_max: normalizedMax,
                  rate_type: normalizeRateType(rateType) || "hourly",
                  portfolio_url: portfolio.trim() || null,
                  phone_number: phone.trim() || null,
                  bio: bio.trim() || null,
                  skills,
                  service_slugs: serviceSlugs,
                  featured,
                  status: activeStatus,
                  photo_url: uploadedPhotoUrl,
                  updated_at: new Date().toISOString(),
                };

                if (freelancerId) {
                  const { error } = await supabase
                    .from("freelancers")
                    .update(payload)
                    .eq("id", freelancerId);
                  if (error) throw error;
                } else {
                  const { error } = await supabase
                    .from("freelancers")
                    .insert(payload);
                  if (error) throw error;
                }

                router.push("/admin/freelancers");
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Failed to save freelancer.",
                );
              } finally {
                setSubmitting(false);
              }
            })();
          }}
        >
          <div className="p-8 space-y-8">
            {/* Import profile data */}
            <div className="rounded-2xl border border-dashed bg-muted/20 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Import Profile Data
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload .xlsx, .xls, .csv, .txt, or .json to auto-fill form
                    fields.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={importing}
                  onClick={() => importInputRef.current?.click()}
                >
                  {importing ? "Importing..." : "Upload Data File"}
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.json"
                  className="hidden"
                  onChange={(e) => {
                    (async () => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setImporting(true);
                      setImportNotice(null);
                      setError(null);

                      try {
                        const record = await parseImportFile(file);
                        const updatedCount = applyImportedValues(record);
                        if (updatedCount === 0) {
                          setError(
                            "No recognized fields found. Use headers like Full Name, Title, Location, Skills, Rate Type, and Status.",
                          );
                        } else {
                          setImportNotice(
                            `Imported ${updatedCount} field${updatedCount === 1 ? "" : "s"} from ${file.name}.`,
                          );
                        }
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Failed to parse import file.",
                        );
                      } finally {
                        setImporting(false);
                        e.target.value = "";
                      }
                    })();
                  }}
                />
              </div>
              {importNotice ? (
                <p className="mt-3 text-xs font-medium text-green-600">
                  {importNotice}
                </p>
              ) : null}
            </div>

            {/* Profile photo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pb-8 border-b">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl bg-muted/40 flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-colors overflow-hidden"
                  aria-label="Upload profile photo"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt="Profile photo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
                  aria-label="Edit photo"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setError("Photo must be under 5 MB.");
                      return;
                    }
                    setPhotoFile(file);
                    const nextUrl = URL.createObjectURL(file);
                    setPhotoPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return nextUrl;
                    });
                  }}
                />
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">Profile Photo</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a professional high-resolution headshot. JPG, PNG or
                  WebP. Max 5MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <Field label="Full Name">
                <InputShell icon={<User className="h-4 w-4" />}>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="Johnathan Doe"
                    type="text"
                  />
                </InputShell>
              </Field>

              <Field label="Professional Title">
                <InputShell icon={<Briefcase className="h-4 w-4" />}>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="Senior Full Stack Engineer"
                    type="text"
                  />
                </InputShell>
              </Field>

              <Field label="Location">
                <InputShell icon={<MapPin className="h-4 w-4" />}>
                  <input
                    list="nigeria-states"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="Select or type a state..."
                    type="text"
                    autoComplete="off"
                  />
                  <datalist id="nigeria-states">
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </InputShell>
              </Field>

              <Field label="Years of Experience">
                <InputShell icon={<Tag className="h-4 w-4" />}>
                  <select
                    value={experience}
                    onChange={(e) =>
                      setExperience(e.target.value as ExperienceOption)
                    }
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm appearance-none"
                  >
                    <option value="">Select experience</option>
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>5-8 years</option>
                    <option>8+ years</option>
                  </select>
                </InputShell>
              </Field>

              <Field label="Payment Type">
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RATE_TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRateType(value)}
                        className={
                          "py-3 px-2 rounded-xl border text-sm font-semibold transition-colors " +
                          (normalizeRateType(rateType) === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 border-border text-foreground hover:border-primary/50")
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <input
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Or type custom rate type (e.g. weekly, per sprint, daily)"
                    type="text"
                  />
                </div>
              </Field>

              <Field label={`Price Range (₦) ${getRateSuffix(rateType)}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputShell
                    icon={<span className="text-sm font-bold">₦</span>}
                  >
                    <input
                      value={hourlyRateMin}
                      onChange={(e) => {
                        const next = e.target.value;
                        setHourlyRateMin(next);
                        if (!hourlyRate) setRate(next);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                      placeholder="Minimum (e.g. 1000)"
                      inputMode="decimal"
                    />
                  </InputShell>

                  <InputShell
                    icon={<span className="text-sm font-bold">₦</span>}
                  >
                    <input
                      value={hourlyRateMax}
                      onChange={(e) => {
                        const next = e.target.value;
                        setHourlyRateMax(next);
                        if (!hourlyRate) setRate(next);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                      placeholder="Maximum (e.g. 50000)"
                      inputMode="decimal"
                    />
                  </InputShell>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  If you set both values, freelancer cards will show a range
                  like “₦1,000 - ₦50,000{getRateSuffix(rateType)}”.
                </p>
              </Field>

              <Field label="Portfolio Link">
                <InputShell icon={<LinkIcon className="h-4 w-4" />}>
                  <input
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="https://portfolio.com/user"
                    type="url"
                  />
                </InputShell>
              </Field>

              <Field label="Phone Number (Nigeria)">
                <InputShell
                  icon={<span className="text-sm font-bold">📞</span>}
                >
                  <input
                    value={phone}
                    onChange={(e) => {
                      // Allow only digits, spaces, dashes, plus
                      const v = e.target.value.replace(/[^\d\s+\-()]/g, "");
                      setPhone(v);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="e.g. 0801 234 5678 or +234 801 234 5678"
                    type="tel"
                    inputMode="tel"
                  />
                </InputShell>
              </Field>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground/80">
                  Professional Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-4 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm resize-none"
                  placeholder="Briefly describe your expertise, major achievements, and professional background..."
                  rows={4}
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground/80">
                  Skills &amp; Expertise
                </label>
                <div className="p-3 bg-muted/30 border border-border rounded-xl flex flex-wrap gap-2 min-h-12.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          setSkills((prev) => prev.filter((s) => s !== skill))
                        }
                        className="ml-1 rounded hover:bg-primary/10"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const next = skillInput.trim();
                      if (!next) return;
                      if (
                        skills.some(
                          (s) => s.toLowerCase() === next.toLowerCase(),
                        )
                      ) {
                        setSkillInput("");
                        return;
                      }
                      setSkills((prev) => [...prev, next]);
                      setSkillInput("");
                    }}
                    className="border-none bg-transparent focus-visible:outline-none focus-visible:ring-0 p-1 text-sm flex-1 min-w-35"
                    placeholder="Add more..."
                    type="text"
                  />
                </div>
              </div>
            </div>

            {/* Service Categories */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-foreground/80">
                Service Categories
              </label>
              <p className="text-xs text-muted-foreground -mt-1">
                Select all services this freelancer offers. Used to list them
                under the right service pages.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {serviceCategories.map((cat) => {
                  const checked = serviceSlugs.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() =>
                        setServiceSlugs((prev) =>
                          checked
                            ? prev.filter((s) => s !== cat.slug)
                            : [...prev, cat.slug],
                        )
                      }
                      className={
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors text-left " +
                        (checked
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/30 border-border text-foreground hover:border-primary/40")
                      }
                    >
                      <span
                        className={
                          "inline-flex size-4 shrink-0 items-center justify-center rounded border transition-colors " +
                          (checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border")
                        }
                      >
                        {checked && (
                          <svg
                            viewBox="0 0 10 8"
                            fill="none"
                            className="size-2.5"
                          >
                            <path
                              d="M1 4l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      {cat.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured toggle */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Featured Freelancer
                    </span>
                    <span
                      className={
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " +
                        (featured
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {featured ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Boost this profile to the top of search results and
                    marketplace homepage.
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={featured}
                  onClick={() => setFeatured((v) => !v)}
                  className={
                    "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                    (featured
                      ? "border-primary bg-primary"
                      : "border-border bg-muted")
                  }
                >
                  <span
                    className={
                      "inline-block h-6 w-6 transform rounded-full bg-background shadow-sm transition-transform duration-200 " +
                      (featured ? "translate-x-7" : "translate-x-1")
                    }
                  />
                </button>
              </div>
            </div>

            {/* Status toggle */}
            <div className="rounded-2xl border bg-muted/30 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Profile Status
                    </span>
                    <span
                      className={
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " +
                        (activeStatus === "active"
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {activeStatus}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activeStatus === "active"
                      ? "Active - visible to clients on the marketplace."
                      : "Inactive - hidden from the marketplace."}
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={activeStatus === "active"}
                  onClick={() =>
                    setActiveStatus((v) =>
                      v === "active" ? "inactive" : "active",
                    )
                  }
                  className={
                    "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                    (activeStatus === "active"
                      ? "border-green-500 bg-green-500"
                      : "border-border bg-muted")
                  }
                >
                  <span
                    className={
                      "inline-block h-6 w-6 transform rounded-full bg-background shadow-sm transition-transform duration-200 " +
                      (activeStatus === "active"
                        ? "translate-x-7"
                        : "translate-x-1")
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-8 py-6 bg-muted/40 flex items-center justify-end gap-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => router.push("/admin/freelancers")}
            >
              Cancel
            </Button>
            {error ? (
              <p className="text-sm text-destructive mr-auto">{error}</p>
            ) : null}
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                className="rounded-xl font-semibold"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : freelancerId
                    ? "Update Freelancer"
                    : "Save Freelancer"}
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>

      <div className="p-8 text-center text-muted-foreground text-xs">
        © {new Date().getFullYear()} ProAssistNG Marketplace Admin. All rights
        reserved.
      </div>
    </motion.div>
  );
}
