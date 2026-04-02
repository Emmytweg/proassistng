import Link from "next/link";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BrowseTalentsContent from "./browse-talents-content";
import { serviceCategories } from "@/lib/services";

export default function BrowseTalentPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 pt-24">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Hire Top Nigerian Freelancers
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Discover vetted professionals for virtual assistance, copywriting,
          website development, graphic design, and UI/UX. ProAssistNG helps you
          hire trusted Nigerian freelancers quickly and confidently.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {serviceCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/services/${encodeURIComponent(category.slug)}`}
              className="inline-flex rounded-full border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {category.title}
            </Link>
          ))}
        </div>
      </section>

      <BrowseTalentsContent />
      <Footer />
    </main>
  );
}
