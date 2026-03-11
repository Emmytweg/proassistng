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

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { serviceCategories } from "@/lib/services";

type ExperienceOption =
  | ""
  | "1-2 years"
  | "3-5 years"
  | "5-8 years"
  | "8+ years";

type RateType = "hourly" | "milestone" | "contract";

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

const RATE_TYPE_OPTIONS: { value: RateType; label: string; suffix: string }[] =
  [
    { value: "hourly", label: "Per Hour", suffix: "/hr" },
    { value: "milestone", label: "Per Milestone", suffix: "/milestone" },
    { value: "contract", label: "Contract Based", suffix: " (contract)" },
  ];

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
  rate_type: RateType;
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
  const [rateType, setRateType] = useState<RateType>(
    initialData?.rate_type ?? "hourly",
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
  const [error, setError] = useState<string | null>(null);

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
                const payload = {
                  full_name: fullName.trim() || "Unnamed",
                  title: title.trim() || null,
                  location: location.trim() || null,
                  experience: experience || null,
                  hourly_rate: Number.isFinite(hourly) ? hourly : null,
                  rate_type: rateType,
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
                <div className="grid grid-cols-3 gap-2">
                  {RATE_TYPE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRateType(value)}
                      className={
                        "py-3 px-2 rounded-xl border text-sm font-semibold transition-colors " +
                        (rateType === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/30 border-border text-foreground hover:border-primary/50")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label={`Rate (₦) ${RATE_TYPE_OPTIONS.find((o) => o.value === rateType)?.suffix ?? ""}`}
              >
                <InputShell icon={<span className="text-sm font-bold">₦</span>}>
                  <input
                    value={hourlyRate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    placeholder="e.g. 25000"
                    inputMode="decimal"
                  />
                </InputShell>
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
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/20">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  Featured Freelancer
                </span>
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
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                  (featured ? "bg-primary" : "bg-muted")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 transform rounded-full bg-background transition-transform " +
                    (featured ? "translate-x-5" : "translate-x-1")
                  }
                />
              </button>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  Profile Status
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeStatus === "active"
                    ? "Active — visible to clients on the marketplace."
                    : "Inactive — hidden from the marketplace."}
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
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                  (activeStatus === "active" ? "bg-green-500" : "bg-muted")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 transform rounded-full bg-background transition-transform " +
                    (activeStatus === "active"
                      ? "translate-x-5"
                      : "translate-x-1")
                  }
                />
              </button>
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
