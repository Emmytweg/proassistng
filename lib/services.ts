import {
  BarChart3,
  Code2,
  FileText,
  Headphones,
  Megaphone,
  Palette,
  PenTool,
  SpellCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ServiceCategory = {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  icon: LucideIcon;
};

export const serviceCategories: ServiceCategory[] = [
  {
    slug: "content-writing",
    title: "Content Writing & Copywriting",
    description:
      "Hire Nigerian copywriters and content writers for blog posts, website content, product descriptions, and long-form articles designed to boost SEO and drive conversions.",
    imageUrl: "/creative-writing.jpg",
    icon: PenTool,
  },
  {
    slug: "web-development",
    title: "Web Development",
    description:
      "Hire Nigerian website developers to build high-performing websites, web apps, and e-commerce platforms—focused on speed, security, and user experience.",
    imageUrl: "/web-dev.jpg",
    icon: Code2,
  },
  {
    slug: "graphic-deigner",
    title: "Graphic Design",
    description:
      "Hire graphic designers in Nigeria for logos, brand identity, social media designs, and marketing assets—crafted for modern brands.",
    imageUrl: "/graphics-designer.jpg",
    icon: Palette,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    description:
      "Hire UI/UX designers in Nigeria to create intuitive interfaces, user flows, and product experiences for web and mobile apps.",
    imageUrl: "/ui-ux.jpg",
    icon: Palette,
  },
  {
    slug: "virtual-assistance",
    title: "Virtual Assistance",
    description:
      "Hire a virtual assistant in Nigeria for admin tasks, research, scheduling, customer support, and inbox management.",
    imageUrl: "/virtual-ass.jpg",
    icon: Headphones,
  },
];

export function getServiceCategory(slug: string) {
  return serviceCategories.find((c) => c.slug === slug) ?? null;
}
