"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const collageImages = [
  {
    src: "/5.png",
    alt: "African professional working",
    mobileClassName: "col-start-1 col-span-6 row-start-2 row-span-3",
    desktopClassName: "absolute right-20 top-10 z-30 h-64 w-48",
  },
  {
    src: "/6.png",
    alt: "African woman writing at desk",
    mobileClassName: "col-start-7 col-span-6 row-start-1 row-span-4",
    desktopClassName: "absolute left-20 top-40 z-40 h-32 w-40",
  },
  {
    src: "/7.png",
    alt: "Video call with African professional",
    mobileClassName: "col-start-1 col-span-4 row-start-5 row-span-2",
    desktopClassName: "absolute -left-[40px] bottom-14 z-20 h-20 w-44",
  },
  {
    src: "/8.png",
    alt: "Meeting with African business professional",
    mobileClassName: "col-start-4 col-span-6 row-start-5 row-span-4",
    desktopClassName: "absolute right-48 -bottom-10 z-10 h-44 w-60",
  },
  {
    src: "/9.png",
    alt: "Team collaboration",
    mobileClassName: "col-start-10 col-span-3 row-start-5 row-span-2",
    desktopClassName: "absolute left-[400px] bottom-14 z-20 h-20 w-44",
  },
];

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-foreground"
            >
              No long-term contracts.
              <br />
              No catches.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 text-muted-foreground text-lg"
            >
              Start hiring trusted Nigerian freelancers for your next
              project—fast, affordable, and reliable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              {/* <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/freelancers">Learn more</Link>
              </Button> */}

              <Button asChild className="w-full sm:w-auto">
                <Link href="/browse-talents" className="inline-flex items-center gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Right: Photo collage */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="relative mx-auto w-full max-w-xl"
          >
            {/* Mobile: mosaic layout (different from desktop collage) */}
            <div className="md:hidden mx-auto grid w-full max-w-md grid-cols-12 grid-rows-8 gap-3 h-130">
              {collageImages.map((img) => (
                <div
                  key={img.src}
                  className={
                    (img.mobileClassName ?? "") +
                    " relative overflow-hidden shadow-lg"
                  }
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 640px) 480px, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Desktop: collage */}
            <div className="relative hidden h-115 md:block">
              {collageImages.map((img) => (
                <div
                  key={img.src}
                  className={
                    img.desktopClassName + " overflow-hidden  shadow-lg"
                  }
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
