// components/sections/why-choose-premium.tsx
"use client";

import { Feature } from "@/components/ui/feature-section-with-bento-grid";

const features = [
  {
    title: "Vetted Nigerian Professionals",
    description:
      "Every freelancer is screened for skill, professionalism, and reliability—so you can hire with confidence.",
    image: {
      src: "/1.png",
      alt: "Professionals collaborating",
    },
  },
  {
    title: "Trust, Accountability, and Quality",
    description:
      "Work with talent that shows up, communicates clearly, and delivers quality—backed by platform standards.",
    image: {
      src: "/2.png",
      alt: "Handshake and agreement",
    },
  },
  {
    title: "Simple Remote Hiring",
    description:
      "Find the right person fast and collaborate remotely with less back-and-forth—ideal for busy teams.",
    image: {
      src: "/3.png",
      alt: "Remote work on laptop",
    },
  },
  {
    title: "Affordable & Transparent",
    description:
      "Get top Nigerian talent at competitive rates, with clarity on what you’re paying for from day one.",
    image: {
      src: "/4.png",
      alt: "Budget planning and paperwork",
    },
  },
];

export default function WhyChoosePremium() {
  return (
    <section className="py-32 bg-linear-to-b from-background/50 to-background ">
      <div className="max-w-7xl mx-auto px-6 ">
        <Feature
          variant="embedded"
          showHeader
          badgeLabel="ProAssistNG"
          title="Why Choose ProAssistNG"
          description="ProAssistNG connects businesses with reliable and skilled Nigerian professionals. Our mission is to make hiring remote talent simple, affordable, and trustworthy."
          items={features}
        />
      </div>
    </section>
  );
}
