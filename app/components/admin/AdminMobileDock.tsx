"use client";

import * as React from "react";
import { LayoutDashboard, UserPlus, Users, Mail, BookUser } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useMotionValue,
  motion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const navItems = [
  { href: "/admin", Icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/add-freelancer", Icon: UserPlus, label: "Add Freelancer" },
  { href: "/admin/freelancers", Icon: Users, label: "Freelancers" },
  { href: "/admin/messages", Icon: Mail, label: "Messages" },
  { href: "/admin/subscribers", Icon: BookUser, label: "Subscribers" },
];

interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
  active: boolean;
}

function DockItem({ mouseX, children, active }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 72, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [40, 72], [1, 1.4]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={
        "aspect-square rounded-full flex items-center justify-center transition-colors " +
        (active
          ? "bg-background text-foreground"
          : "bg-primary text-secondary-foreground")
      }
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function AdminMobileDock() {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4">
      <motion.div
        onMouseMove={(e: React.MouseEvent) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex h-16 items-end gap-4 rounded-2xl bg-foreground border border-background/10 shadow-xl px-4 pb-3"
      >
        {navItems.map(({ href, Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname?.startsWith(`${href}/`));

          return (
            <DockItem key={href} mouseX={mouseX} active={active}>
              <Link
                href={href}
                aria-label={label}
                className="flex items-center justify-center w-full h-full"
              >
                <Icon className="w-5 h-5" />
              </Link>
            </DockItem>
          );
        })}
      </motion.div>
    </div>
  );
}
