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
    title: "Creative Writing",
    description:
      "Engage your audience with expertly crafted blog posts, website content, and long-form articles designed to boost SEO and drive conversions.",
    imageUrl: "/creative-writing.jpg",
    icon: PenTool,
  },
  {
    slug: "web-development",
    title: "Web Development",
    description:
      "Build high-performing websites, web apps, and e-commerce platforms with skilled developers focused on speed, security, and user experience.",
    imageUrl: "/web-dev.jpg",
    icon: Code2,
  },
  {
    slug: "graphic-deigner",
    title: "Graphic Designers",
    description:
      "Enhance your brand with stunning graphics, logos, and visual assets created by professional graphic designers.",
    imageUrl: "/graphics-designer.jpg",
    icon: Palette,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    description:
      "Transform your digital products with intuitive, user-friendly interfaces and exceptional user experiences crafted by expert designers.",
    imageUrl: "/ui-ux.jpg",
    icon: Palette,
  },
  {
    slug: "virtual-assistance",
    title: "Virtual Assistance",
    description:
      "Streamline your workflow with reliable virtual assistants for admin tasks, research, scheduling, and inbox management.",
    imageUrl: "/virtual-ass.jpg",
    icon: Headphones,
  },
];

export function getServiceCategory(slug: string) {
  return serviceCategories.find((c) => c.slug === slug) ?? null;
}
