import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustedBy from "./components/FeaturedFreelancers";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import WhyChoose from "./components/WhyChoose";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire Vetted Nigerian Freelancers",
  description:
    "Hire trusted Nigerian freelancers for design, development, marketing, writing, and virtual assistance. ProAssistNG connects you with vetted professionals fast.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <TrustedBy />
        <Services />
        <HowItWorks />
        <WhyChoose />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
