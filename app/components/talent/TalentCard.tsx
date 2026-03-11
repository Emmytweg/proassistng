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
      return "green-900 bg-green-500";
    case "away":
      return "bg-secondary";
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
        "group rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md hover:border-primary/20 " +
        (featured ? "ring-2 ring-yellow-400/60" : "")
      }
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="rounded-full p-0.5 ring-1 ring-border transition group-hover:ring-2 group-hover:ring-primary/30">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold ">{name}</h3>
              {verified && (
                <span className="inline-flex items-center justify-center rounded-full border bg-background p-0.5 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <BadgeCheck
                    className="size-4 shrink-0"
                    aria-label="Verified"
                  />
                </span>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 text-yellow-600 text-[10px] font-bold px-2 py-0.5">
                  ★ Top Rated
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-primary">{role}</p>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {rating != null && (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-foreground font-medium">
                    {rating.toFixed(1)}
                  </span>
                  {reviews != null && <span>({reviews} reviews)</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" />
                {location}
              </span>
            </div>
          </div>
        </div>
      </header>

      <p className="font-semibold whitespace-nowrap truncate line-clamp-3 mt-2">
        {price}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[11px]">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        {id ? (
          <Link href={`/freelancer/${id}`} className="flex-1">
            <Button type="button" className="w-full">
              View Profile
            </Button>
          </Link>
        ) : (
          <Button type="button" className="flex-1">
            View Profile
          </Button>
        )}
        {id ? (
          <Link href={`/freelancer/${id}#contact`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Contact
            </Button>
          </Link>
        ) : (
          <Button type="button" variant="outline" className="flex-1">
            Contact
          </Button>
        )}
      </div>
    </article>
  );
}
