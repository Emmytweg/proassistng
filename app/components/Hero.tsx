"use client"

import { DotGlobeHero } from "@/components/ui/globe-hero"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ProAssistHero() {
  return (
    <DotGlobeHero rotationSpeed={0.004}>
      <div className="text-center max-w-5xl mx-auto px-6 space-y-10">

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          Hire Trusted{" "}
          <span className="text-primary">
            Nigerian Freelancers
          </span>{" "}
          For Your Business
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          ProAssistNG connects businesses with vetted designers,
          developers, marketers, virtual assistants and writers ready to deliver
          high-quality work.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center flex-wrap gap-6"
        >
          <Link
            href="/hire"
            className="flex items-center justify-center gap-2 w-64 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition"
          >
            Hire Talent
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/freelancers"
            className="flex items-center justify-center gap-2 w-64 px-6 py-3 border rounded-lg font-medium hover:bg-muted transition"
          >
            Browse Freelancers
          </Link>
        </motion.div>
      </div>
    </DotGlobeHero>
  )
}