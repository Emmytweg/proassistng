import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proassistng.com.ng";
const SITE_NAME = "ProAssistNG";
const DEFAULT_TITLE = "ProAssistNG - Freelance Marketplace";
const DEFAULT_DESCRIPTION =
  "ProAssistNG is a production-ready freelance marketplace connecting clients with vetted Nigerian professionals.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "ProAssistNG",
    "hire freelancers Nigeria",
    "Nigerian freelancers",
    "virtual assistant Nigeria",
    "copywriter Nigeria",
    "content writer Nigeria",
    "website developer Nigeria",
    "web developer Nigeria",
  ],
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  verification: {
    google: "Cj6Td_ZeVSS1UXNkxKuBLY-j3PMhYbZS4L0rsjKrzjI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: {
          "@id": `${SITE_URL}#organization`,
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
