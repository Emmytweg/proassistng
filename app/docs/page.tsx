import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DocsContent from "./docs-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation & User Guide",
  description: "Learn how to use ProAssistNG.",
};

export default function DocsPage() {
  return (
    <div>
      <Navbar />
      <DocsContent />
      <Footer />
    </div>
  );
}
