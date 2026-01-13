"use client";

import { motion } from "framer-motion";

const sections = [
  {
    title: "Our mission",
    body: "Rezoomind exists to remove the noise from internship search. We verify every listing against credited sources so students can act fast with confidence.",
  },
  {
    title: "How it works",
    body: "We track verified employer feeds, career centers, and trusted job boards, then score and summarize each opportunity. You receive alerts only when they match your preferences.",
  },
  {
    title: "Why verified matters",
    body: "Internship scams waste time and energy. Our team reviews each source before it enters the system, so every alert is grounded in credibility.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-semibold text-white sm:text-4xl"
      >
        About Rezoomind
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-4 max-w-2xl text-base leading-relaxed text-white/70"
      >
        We believe every student should have access to trustworthy internship
        opportunities, without spending hours on unreliable listings.
      </motion.p>

      <div className="mt-12 grid gap-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          >
            <h2 className="text-xl font-semibold text-white">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {section.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
