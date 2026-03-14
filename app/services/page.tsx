import Link from "next/link";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import type { ServiceCategory } from "@/lib/services";
import { serviceCategories } from "@/lib/services";

function CategoryCard({ slug, title, description, imageUrl, icon: Icon }: ServiceCategory) {
  
  return (
    <Link
      href={`/services/${slug}`}
      className="group relative aspect-4/5 overflow-hidden rounded-xl bg-muted transition-all duration-500 shadow-xl hover:shadow-green-600/20"
    >
      <img
        alt={title}
        src={imageUrl}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-transparent" />
      {/* Hover tint overlay */}
      <div className="absolute inset-0 bg-green-600/0 transition-colors duration-300 group-hover:bg-green-600/40" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg border border-green-600/30 bg-green-600/20 backdrop-blur-md">
          <Icon className="h-5 w-5 text-green-400" />
        </div>
        <h3 className="text-xl font-bold leading-tight">{title}</h3>
        <p className="mt-2 text-sm text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function ServicesPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-muted/30 text-foreground">
      {/* Navigation Bar */}
     <Navbar />

      <main className="w-full max-w-7xl flex-1 mx-auto px-6 py-12 pt-20">
        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-green-600">
            Categories
          </span>
          <h1 className="mt-4 mb-6 text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl">
            Explore Professional Services
          </h1>
          <p className="text-lg text-muted-foreground">
            Unlock world-class talent tailored to your business needs. From
            writing and content to design, development, and marketing—find your
            perfect match today.
          </p>
        </div>

        {/* Categories Grid */}
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2  ${
                 serviceCategories.length - 1 && serviceCategories.length % 2 !== 0
                  ? "sm:col-span-2"
                  : ""
              } `}>
          {serviceCategories.map((cat) => (
            <CategoryCard key={cat.title} {...cat}  />
          ))}
        </div>

        {/* Call to Action Section */}
        <section className="mt-20 rounded-2xl border border-green-600/10 bg-background px-8 py-8 text-center md:px-12 md:py-12">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Our expert support team is available 24/7 to help you find the right
            specialist for your unique requirements.
          </p>
          <button className="rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-600/90">
            Contact Support
          </button>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
