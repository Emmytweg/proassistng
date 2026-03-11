import type { Metadata } from "next";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactContent from "./contact-content";

export const metadata: Metadata = {
  title: "Contact | ProAssistNG",
  description:
    "Get in touch with ProAssistNG for hiring support, account questions, billing help, or partnerships.",
};

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <ContactContent />
      <Footer />
    </div>
  );
}
