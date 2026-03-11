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
    title: "Content Writing",
    description:
      "SEO blog posts, website content, and long-form articles written to sound human and convert.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9KSXps_iGyDtyA_uyIG4shcSf4VuTJMJoOrsINKy2PfAgbU3eozgBVlSc9zd3vKA8mZIZcfMSawoBmP0RQkhkgpWw6EJMhZ9zwVVSA-uvi1JLs1WsUD-hIVIj7hC-15juz-W8OPwSg3f048m0VcWP9aCfJyA-x-AvBfjYFB3Dsboj5hLePaDl4wpXx0Eqe99Z0eiEmB6YqD-LlRZKdmVJ28WeH844RgSWpaERh1IPk13gUE9rJ3UdJzknYAxaYq3Zfd2XrB4kQvGx",
    icon: PenTool,
  },
  {
    slug: "copywriting",
    title: "Copywriting",
    description:
      "Landing pages, product descriptions, ads, and email sequences designed to drive clicks and sales.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7QvGAU7xxA_e-RnYmqvdpTO-CfEprN6Eh85W0oMzYR5d4fM_z0aUXAezr77NquRo6mg2H3KUgbJR12qHt-uYyrFn9pRDzBblqq8REhJH2_JU2_wyK5NBcl8sG5hU4P7ss0czRsvVggJaFz3DP7VWkZAVeoLmpcyC48D00HOKrnHdbxnueGtXaNGwjWd8w35pgsH6d_SNT9bmvUtcTbdddVwfg-Jo9hRDXLJpiFkC-VibtvWr_W5spI6glMe6dvUt4JryqAyfaKHN",
    icon: FileText,
  },
  {
    slug: "editing-proofreading",
    title: "Editing & Proofreading",
    description:
      "Grammar, clarity, tone, and structure—turn drafts into clean, publish-ready writing.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDtU2vrpy_QFBfD8bETMX_9QLZnEwYSvHLIJmgh43xb0LoEbvgnAA5Oc116UzSSJQWGhNkxpGysNy-0OGpuG2shzW8aTvbl2I1lsCmgswE0V6WrmdBSAhvo_FknG3Bhc2hXAwv5-cd4wIbKN4MEiwAyJxuQ-EDRlP64YIeQ07YBGAIx2J3WuqJVzxCqUksv_Qqt-ARvMAvGv-HdfJRDJv9m-P5UtyqMmGPEHk2zlfFXVk05DGIO03HXEN0WnUTe7LvZn0OL-LhT388",
    icon: SpellCheck,
  },
  {
    slug: "web-development",
    title: "Web Development",
    description:
      "Hire experienced developers to build websites, web apps, and e-commerce platforms.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMij0DVP2OyEJ1-0OBXujGtvaidMPKGCnUbo7qHcYGXp486mutnBM49whEYrIx8HAwIEJ-tkR4xO6Icb7f8VtutiAC6Ry1W7xtlYes2JLb9_Q4l5F4aW_7aOrwLHQX7LM2tFvdq8dlx4ZhGMb8ILcNJ1yyMjXKxZ94Nfx4e-I9qLinbP8iEO9NYvCP_s7zokuj_9IWr4KUTuxvKMbvGF_bV6YZFOvq5bUeEuxq0V3ZfIYZjgnXliMB5k76xrBRvJHWnzpa3_9wEN1Y",
    icon: Code2,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    description:
      "Professional designers creating beautiful and user-friendly product experiences.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBpsz5UVYwakxBAf8hxA5bQ43_aawe2vP-q-z6Ofu-lhRWVRekQVM51HxEtmapugtQ-zYntUItzhwB2vvCYCF3YTBpqkj8I1X2nI-n1hz0-Ph9IfmFYGYBLjVSL7Mg3ctlOCsP7pXT16XGSfW6zpW11BLZFpt_rr0oxPxKetTW7IVNEKmJ646fsFeS-qmokrCkChCI8tgsowuYOrjrqJBfY9TB9z5RiLqNwtP_Hdmb3rX_-ksjYmCILty_QnL-pRxZ27HgFa2F2_nX4",
    icon: Palette,
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    description:
      "Grow your business with SEO, paid ads, and social media marketing.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3vXFr6yX2XrGB5M2N7y4vNkJl0Re4mW6w4Otp9w6MI4C_wkL0n2TmvgejALcWaChQ9xSe3xfn71ALDyqmcDH5NRVOYCwtTLgcZxkqJhBE0DpuMgiQpB8xd_24SjNBJd4_tyE4rF6bEXmAOgsgL32M-TrKC109LqR_JKUU-riRk252t1DuXzI7NtTJTrjUDqRqR7_-5DI9Ip1aNIE9YcZ5NWXqTtzi7WdvlhxY9BaCxAH8TrRj45aJSuSXQ7FgzxC7TouPA6C0N53N",
    icon: Megaphone,
  },
  {
    slug: "data-analytics",
    title: "Data & Analytics",
    description:
      "Turn data into insights with dashboards, reports, and analysis that supports better decisions.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD1AS2gs2egdymspdkgUqIJ-lgFp2O9RIGZJOuu-DrXi7Au0DgpdvnVf1kwam4VDMZR6W8u921RaIASEPE-9Ef2c3FHE808tq3OzFVv_u9r6XdyOnJI0dOx3aCSd6aZ5rgvtOP1Xpnp03YNBieasBD5Cf5M7vB104Ie4Jw-Pl1ACRt05yiZAvZuWXxS1NSSmJ6GkHyzFBq1-rhmjnJXxkJz4brJMl4aT-W5ZF01QcGjGEdB6Qo9gPDF4nLyAui3O4aOlRdv8cwzCDFM",
    icon: BarChart3,
  },
  {
    slug: "virtual-assistance",
    title: "Virtual Assistance",
    description:
      "Reliable assistants to handle admin tasks, research, scheduling, inbox management, and operations.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrvrJI8ihia_UgLqX69eRxH8Gk-bC2xi92nCprJVSCWzmcBHqYQ5ChLOKdmirzYtVXtXWpPFt12dXSAozrNR45onrQS-u468vYUIM9i10p9x5cimYJNEAfciAW6aev555_Dml2zqsEzPT-ySyfnEv0-b07ZEnu17lF_Y8NgsqfaLVHxIt53NpHYaXHHXSLqiSvXd4nm3x_eLfmGXPUG-ZBxSh7GysqPuf0gewS36JcVVH4n5j4uxRErardcEliwYekBkcvu39EB1d",
    icon: Headphones,
  },
];

export function getServiceCategory(slug: string) {
  return serviceCategories.find((c) => c.slug === slug) ?? null;
}
