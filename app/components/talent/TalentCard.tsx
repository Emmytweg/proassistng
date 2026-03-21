import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type TalentCardProps = {
  id?: string;
  name: string;
  role: string;
  status?: "online" | "offline" | "away";
  price: string;
  image?: string | null;
  rating?: number | null;
  reviews?: number | null;
  location: string;
  bio: string;
  tags: string[];
  verified?: boolean;
  featured?: boolean;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function statusClasses(status: "online" | "offline" | "away") {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-amber-400";
    case "offline":
    default:
      return "bg-muted-foreground";
  }
}

export default function TalentCard({
  id,
  name,
  role,
  status = "online",
  price,
  image,
  rating,
  reviews,
  location,
  bio,
  tags,
  verified = true,
  featured = false,
}: TalentCardProps) {
  return (
    <article
      className={
        "group overflow-hidden rounded-3xl border bg-card p-4 shadow-sm transition hover:border-primary/20 hover:shadow-md sm:p-5 " +
        (featured ? "ring-2 ring-yellow-400/60" : "")
      }
    >
      <header className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div className="rounded-full p-0.5 ring-1 ring-border transition group-hover:ring-2 group-hover:ring-primary/30">
            {image ? (
              <Image
                src={image}
                alt={name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                {getInitials(name)}
              </div>
            )}
          </div>

          <span
            className="absolute -right-0.5 -bottom-0.5 inline-flex size-3 items-center justify-center"
            aria-label={`Status: ${status}`}
          >
            <span
              className={
                "relative block size-3 rounded-full ring-2 ring-card " +
                statusClasses(status)
              }
            >
              {status === "online" && (
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              )}
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="truncate text-base font-semibold leading-tight sm:text-lg">
              {name}
            </h3>
            {verified && (
              <span className="inline-flex items-center justify-center rounded-full border bg-background p-0.5 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                <BadgeCheck className="size-4 shrink-0" aria-label="Verified" />
              </span>
            )}
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 text-yellow-700 text-[10px] font-bold px-2 py-0.5">
                ★ Top Rated
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-sm font-medium text-primary sm:text-[15px]">
            {role}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {rating != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-foreground font-medium">
                  {rating.toFixed(1)}
                </span>
                {reviews != null && <span>({reviews})</span>}
              </span>
            )}

            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mt-3  px-3.5 py-2.5">
        
        <p className="mt-0.5 text-sm font-bold text-foreground sm:text-base">
          {price}
        </p>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {bio}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[11px]">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {id ? (
          <Link href={`/freelancer/${id}`} className="w-full sm:flex-1">
            <Button type="button" className="h-10 w-full rounded-xl">
              View Profile
            </Button>
          </Link>
        ) : (
          <Button type="button" className="h-10 w-full rounded-xl sm:flex-1">
            View Profile
          </Button>
        )}
        {id ? (
          <Link href={`/freelancer/${id}#contact`} className="w-full sm:flex-1">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl"
            >
              Contact
            </Button>
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl sm:flex-1"
          >
            Contact
          </Button>
        )}
      </div>
    </article>
  );
}
