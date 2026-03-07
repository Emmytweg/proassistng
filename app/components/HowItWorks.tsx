"use client"

import { motion } from "framer-motion"
import { Search, FileText, Rocket } from "lucide-react"

const steps = [
  {
    title: "Browse Freelancers",
    description:
      "Explore skilled Nigerian professionals across development, design, marketing and more.",
    icon: Search,
  },
  {
    title: "Submit Your Project",
    description:
      "Describe your project, timeline, and budget to find the perfect match.",
    icon: FileText,
  },
  {
    title: "Start Working",
    description:
      "Collaborate with your freelancer and get your project delivered quickly.",
    icon: Rocket,
  },
]

export default function HowItWorks() {
  return (
    <section className="py-32 bg-background">

      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-24">

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            How ProAssistNG Works
          </h2>

          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Hiring talented Nigerian professionals takes just a few steps.
          </p>

        </div>

        {/* Workflow Container */}
        <div className="relative">

          {/* Animated Vertical Line */}
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true }}
            className="absolute left-6 top-0 w-[3px] bg-gradient-to-b from-primary via-primary/50 to-transparent"
          />

          <div className="space-y-24">

            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.3 }}
                  viewport={{ once: true }}
                  className="flex gap-10 items-start"
                >

                  {/* Icon Node */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg"
                  >
                    <Icon className="w-15 h-5 md:w-5 md:h-5" />
                  </motion.div>

                  {/* Content */}
                  <div className="max-w-xl">

                    <h3 className="text-xl font-semibold mb-2">
                      {step.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                  </div>

                </motion.div>
              )
            })}

          </div>

        </div>

      </div>

    </section>
  )
}