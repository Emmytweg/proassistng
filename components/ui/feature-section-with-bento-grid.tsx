import type { LucideIcon } from "lucide-react";
import { User } from "lucide-react";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";

type FeatureItem = {
  title: string;
  description: string;
  icon?: LucideIcon;
  image?: {
    src: string;
    alt: string;
  };
};

type FeatureProps = {
  badgeLabel?: string;
  title?: string;
  description?: string;
  items?: FeatureItem[];
  showHeader?: boolean;
  variant?: "standalone" | "embedded";
};

function Feature({
  badgeLabel = "Platform",
  title = "Something new!",
  description = "Managing a small business today is already tough.",
  items = [
    {
      title: "Pay supplier invoices",
      description:
        "Our goal is to streamline SMB trade, making it easier and faster than ever.",
      icon: User,
    },
    {
      title: "Pay supplier invoices",
      description:
        "Our goal is to streamline SMB trade, making it easier and faster than ever.",
      icon: User,
    },
    {
      title: "Pay supplier invoices",
      description:
        "Our goal is to streamline SMB trade, making it easier and faster than ever.",
      icon: User,
    },
    {
      title: "Pay supplier invoices",
      description:
        "Our goal is to streamline SMB trade, making it easier and faster than ever.",
      icon: User,
    },
  ],
  showHeader = true,
  variant = "standalone",
}: FeatureProps) {
  const rootClassName =
    variant === "standalone" ? "w-full py-20 lg:py-40" : "w-full";

  const containerClassName =
    variant === "standalone" ? "container mx-auto" : "";
  const tileMotionClassName =
    "transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.02]";

  return (
    <div className={rootClassName}>
      <div className={containerClassName}>
        <div className={variant === "standalone" ? "flex flex-col gap-10" : ""}>
          {showHeader && (
            <div className="flex gap-4 flex-col items-start">
              <div>
                <Badge>{badgeLabel}</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                  {title}
                </h2>
                <p className="text-lg max-w-xl mb-4 lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                  {description}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => {
              const Icon = item.icon ?? User;
              const hasImage = Boolean(item.image?.src);

              const tileClassName =
                index === 0 || index === 3
                  ? "bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-square lg:aspect-auto flex justify-between flex-col"
                  : "bg-muted rounded-md aspect-square p-6 flex justify-between flex-col";

              return (
                <div
                  key={`${item.title}-${index}`}
                  className={`group ${tileClassName} ${tileMotionClassName} ${
                    hasImage
                      ? "relative overflow-hidden border bg-card text-foreground"
                      : ""
                  }`}
                >
                  {hasImage && item.image ? (
                    <>
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />

                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/55 to-black/40" />
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/10" />

                      <div className="relative z-10 flex h-full flex-col justify-end">
                        <div className="flex flex-col">
                          <h3 className="text-xl tracking-tight text-white">
                            {item.title}
                          </h3>
                          <p className="text-white/90 max-w-xs  text-base">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Icon className="w-8 h-8 stroke-1 transition-transform duration-300 group-hover:scale-105" />
                      <div className="flex flex-col">
                        <h3 className="text-xl tracking-tight">{item.title}</h3>
                        <p className="text-muted-foreground max-w-xs text-base">
                          {item.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
export type { FeatureItem, FeatureProps };
