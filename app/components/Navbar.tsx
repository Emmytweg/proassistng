"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Freelancers", href: "/browse-talents" },
  { name: "Services", href: "/services" },
  { name: "How It Works", href: "/how-it-works" },
  // { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-white/70 shadow-sm border-b"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto pr-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight"
          >
            <Image
              src="/logo.png"
              alt="ProAssistNG"
              width={240}
              height={160}
              priority
              sizes="(min-width: 768px) 240px, 176px"
              className="rounded-full w-44 md:w-60 h-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium text-gray-700 hover:text-black transition"
                >
                  {link.name}

                  {active && (
                    <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-green-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/browse-talents"
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
            >
              Browse Freelancers
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-800"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div id="mobile-menu" className="md:hidden bg-white border-t">
          <div className="px-6 py-6 flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-medium text-gray-700"
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/browse-talents"
              className="bg-green-600 text-white text-center py-3 rounded-lg font-semibold"
            >
              Browse Freelancers
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
