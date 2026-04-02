import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Freelancers",
  description:
    "Browse vetted Nigerian freelancers by skill, category, and experience level. Find the right talent on ProAssistNG.",
  alternates: {
    canonical: "/browse-talents",
  },
};

export default function BrowseTalentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
