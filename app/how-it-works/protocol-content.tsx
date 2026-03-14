"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Circle, Pentagon, Square, Triangle } from "lucide-react";

function useRevealVariants() {
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" },
    },
  } as const;

  const fadeLeft = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -18 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" },
    },
  } as const;

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  } as const;

  return { fadeUp, fadeLeft, stagger };
}

const steps = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Share your project goals, budget, and timeline. We’ll use your requirements to guide the match.",
    Icon: Square,
  },
  {
    number: "02",
    title: "Get matched with vetted talent",
    description:
      "Review recommended Nigerian freelancers who fit your needs—skills, communication, and reliability.",
    Icon: Triangle,
  },
  {
    number: "03",
    title: "Collaborate and deliver",
    description:
      "Start working remotely and keep things moving with clear communication, progress tracking, and support.",
    Icon: Pentagon,
  },
  {
    number: "04",
    title: "Pay securely",
    description:
      "Make payments with clarity and peace of mind. Payments can be structured around milestones and delivery.",
    Icon: Circle,
  },
] as const;

const benefits = [
  {
    number: "01",
    label: "Vetted professionals",
    description:
      "Hire skilled Nigerian freelancers screened for quality, professionalism, and reliability.",
    metric: "Hire with confidence",
  },
  {
    number: "02",
    label: "Faster matching",
    description:
      "Get connected to the right talent quickly—so your project can move forward without delays.",
    metric: "Move faster",
  },
  {
    number: "03",
    label: "Transparent pricing",
    description:
      "Know what you’re paying for from day one—clear scope, clear expectations, no surprises.",
    metric: "No hidden fees",
  },
  {
    number: "04",
    label: "Secure payments",
    description:
      "Keep payments safe and structured around delivery so both sides can work with trust.",
    metric: "Protected checkout",
  },
] as const;

export default function HowItWorksProtocol() {
  const { fadeUp, fadeLeft, stagger } = useRevealVariants();

  return (
    <main className="pt-28 overflow-x-hidden font-sans bg-white text-black selection:bg-green-600 selection:text-white">
      {/* HERO */}
      <section className="border-b-[3px] border-black">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="p-8 md:p-16 border-r-[3px] border-black"
          >
            <motion.div
              variants={fadeLeft}
              className="inline-flex items-center px-3 py-1 border-[3px] rounded-xl border-black text-xs font-bold mb-8 bg-green-600 text-white uppercase"
            >
              Vetted Nigerian talent
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-6xl md:text-8xl leading-none mb-8 font-bold tracking-tighter"
            >
              How
              <br />
              It Works
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl max-w-md font-medium mb-12 text-black/80"
            >
              ProAssistNG connects businesses with vetted Nigerian
              freelancers—designers, developers, marketers, virtual assistants,
              writers, and more.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className=" flex flex-wrap md:border-[3px] md:border-black"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/browse-talents"
                  className="block px-10 py-5 bg-black text-white font-bold text-xl hover:bg-green-600 transition-colors uppercase"
                >
                  Browse talent
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <a
                  href="#benefits"
                  className="block px-10 py-5 bg-white text-black font-bold text-xl hover:bg-neutral-100 transition-colors md:border-l-[3px] border-black uppercase"
                >
                  See benefits
                </a>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative bg-neutral-100 flex items-center justify-center p-8 overflow-hidden"
          >
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full h-full border-[3px] border-black bg-white p-4 relative create th"
            >
              <img
                alt="Workflow Interface"
                className="w-full h-full object-cover border-[3px] border-black hover:grayscale transition-all"
                src="/1.png"
              />
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-8 right-8 bg-green-600 text-white p-4 border-[3px] hover:bg-green-700 border-black font-bold"
              >
                Trusted match
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* OPERATIONAL WORKFLOW */}
      <section className="border-b-[3px] border-black">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="lg:col-span-4 p-8 md:p-16 border-r-[3px] border-black flex flex-col justify-between"
          >
            <div>
              <h2 className="text-4xl md:text-5xl mb-6 font-bold tracking-tighter">
                Operational
                <br />
                Workflow
              </h2>
              <p className="text-neutral-600 mb-8 font-medium">
                A simple process designed to help you hire faster.
              </p>
            </div>
            <div className="text-6xl font-bold opacity-10">01-04</div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2"
          >
            {steps.map(({ number, title, description, Icon }, index) => (
              <motion.div
                key={number}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={
                  "p-8 group transition-colors border-black hover:bg-green-600 hover:text-white " +
                  (index % 2 === 0 ? "md:border-r-[3px]" : "") +
                  (index < 2 ? " border-b-[3px]" : "")
                }
              >
                <div className="flex items-start gap-6 mb-12">
                  <Icon className="w-14 h-14" />
                  <span className="text-4xl font-bold">{number}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                <p className="font-medium leading-tight text-black/80 group-hover:text-white/90">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BENEFITS */}
      <section
        id="benefits"
        className="border-b-[3px] border-black bg-black text-white"
      >
        <div className="p-8 md:p-16">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            className="text-4xl md:text-6xl mb-16 tracking-tighter font-bold"
          >
            Why businesses choose ProAssistNG
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="border-[3px] border-white"
          >
            {benefits.map((row) => (
              <motion.div
                key={row.number}
                variants={fadeUp}
                className="grid grid-cols-1 md:grid-cols-12 border-b border-white/20 last:border-0 hover:bg-white hover:text-black transition-colors"
              >
                <div className="md:col-span-1 p-4 border-r border-white/20 flex items-center justify-center font-bold">
                  {row.number}
                </div>
                <div className="md:col-span-3 p-4 border-r border-white/20 font-bold tracking-widest">
                  {row.label}
                </div>
                <div className="md:col-span-6 p-4 border-r border-white/20 font-medium ">
                  {row.description}
                </div>
                <div className="md:col-span-2 p-4 border rounded-xl m-2 text-center font-bold text-green-500">
                  {row.metric}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8 flex flex-col items-center justify-center bg-white text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="text-5xl md:text-8xl mb-12 max-w-4xl mx-auto leading-none font-bold tracking-tighter"
        >
          Ready to hire?
        </motion.h2>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="inline-flex flex-col md:flex-row border-[3px] border-black"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/hire"
              className="block px-16 py-8 bg-green-600 text-white font-bold text-2xl hover:bg-black transition-colors uppercase"
            >
              Hire talent
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/browse-talents"
              className="block px-16 py-8 bg-white text-black font-bold text-2xl hover:bg-green-600 hover:text-white transition-colors border-t-[3px] md:border-t-0 md:border-l-[3px] border-black uppercase"
            >
              Browse freelancers
            </Link>
          </motion.div>
        </motion.div>

        <p className="mt-12 text-neutral-500 font-mono text-sm tracking-widest italic">
          ProAssistNG — simple, affordable, and trustworthy hiring.
        </p>
      </section>
    </main>
  );
}
