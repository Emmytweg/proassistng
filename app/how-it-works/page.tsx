import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HowItWorksProtocol from "./protocol-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how ProAssistNG works—from browsing vetted freelancers to hiring and completing projects with confidence.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <div>
      <Navbar />
      <HowItWorksProtocol />
      <Footer />
    </div>
  );
}
