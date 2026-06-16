"use client";

import { motion } from "framer-motion";
import { BookOpen, UserCheck, CreditCard, MonitorPlay } from "lucide-react";

export default function DocsContent() {
  return (
    <main className="pt-28 pb-24 overflow-x-hidden font-sans bg-white text-black selection:bg-green-600 selection:text-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="inline-flex items-center px-3 py-1 border-[3px] rounded-xl border-black text-xs font-bold mb-8 bg-black text-white uppercase">
            User Guide
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Documentation
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl font-medium">
            Everything you need to know about using the ProAssistNG platform. A complete manual for navigating our services, hiring talent, and managing projects.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Section 1 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-[3px] border-black p-8 md:p-12 bg-neutral-50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 text-green-600 border-[3px] border-black rounded-xl">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold">1. Getting Started</h2>
            </div>
            <p className="text-lg text-neutral-700 mb-6 font-medium">
              ProAssistNG is a streamlined platform that connects you directly with top 1% Nigerian freelancers. 
              To get started, you don't need a complex account setup. Simply browse our curated list of talents or tell us what you need.
            </p>
            <ul className="list-disc list-inside text-lg text-neutral-700 font-medium space-y-2">
              <li>Navigate to <strong>Browse Talent</strong> to view vetted freelancers.</li>
              <li>Filter by skill: Web Development, Design, Virtual Assistance, etc.</li>
              <li>Review portfolios, experience levels, and hourly rates transparently.</li>
            </ul>
          </motion.section>

          {/* Section 2 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-[3px] border-black p-8 md:p-12 bg-white"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 text-green-600 border-[3px] border-black rounded-xl">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold">2. The Hiring Process</h2>
            </div>
            <p className="text-lg text-neutral-700 mb-6 font-medium">
              Once you find a freelancer you like, you can request an interview or hire them directly for a project. 
              Our matchmakers are also available to manually pair you with the best fit.
            </p>
            <ul className="list-disc list-inside text-lg text-neutral-700 font-medium space-y-2">
              <li><strong>Step 1:</strong> Submit a project brief detailing your requirements.</li>
              <li><strong>Step 2:</strong> Our system (or team) pairs you with 2-3 perfect candidates.</li>
              <li><strong>Step 3:</strong> Conduct a quick chemistry call to ensure cultural fit.</li>
              <li><strong>Step 4:</strong> Sign the engagement contract and begin work.</li>
            </ul>
          </motion.section>

          {/* Section 3 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-[3px] border-black p-8 md:p-12 bg-neutral-50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-100 text-green-600 border-[3px] border-black rounded-xl">
                <CreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold">3. Secure Payments & Management</h2>
            </div>
            <p className="text-lg text-neutral-700 mb-6 font-medium">
              We handle all the administrative overhead so you can focus on building. Payments are held securely and only released upon milestone completion.
            </p>
            <ul className="list-disc list-inside text-lg text-neutral-700 font-medium space-y-2">
              <li>Payments can be made via credit card, bank transfer, or crypto depending on your region.</li>
              <li>We enforce strict time-tracking and daily updates from freelancers.</li>
              <li>If you are unsatisfied within the first week, we offer a no-questions-asked replacement guarantee.</li>
            </ul>
          </motion.section>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center border-[3px] border-black p-12 bg-black text-white"
        >
          <h2 className="text-4xl font-bold tracking-tighter mb-6">Still confused?</h2>
          <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto font-medium">
            Our support team is available 24/7 to walk you through the platform and help you make your first hire.
          </p>
          <a
            href="https://wa.me/2348108051130"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#25D366] text-white border-[3px] border-black font-bold uppercase hover:bg-[#128C7E] transition-colors gap-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat with us on WhatsApp
          </a>
        </motion.div>
      </div>
    </main>
  );
}
