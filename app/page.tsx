"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { BackgroundMotion } from "@/components/BackgroundMotion";
import { Button } from "@/components/ui/Button";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Pricing } from "@/components/Pricing";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const problems = [
  "Your resume disappears into the ATS black hole",
  "Generic bullet points that don't stand out",
  "No idea why you're not getting callbacks",
  "Hours spent tailoring for each application",
];

const solutions = [
  "AI-powered ATS optimization that beats the bots",
  "Impact-driven bullet points that grab attention",
  "Detailed scoring with actionable feedback",
  "One-click tailoring for any job description",
];

const features = [
  {
    icon: "🎯",
    title: "AI Resume Analysis",
    description:
      "Get a detailed 0-100 score with specific feedback on formatting, content, ATS compatibility, and impact.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: "✨",
    title: "Smart Bullet Improvements",
    description:
      "Transform weak descriptions into powerful, quantified achievements that recruiters love.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "🤖",
    title: "ATS Optimization",
    description:
      "Automatically optimize your resume for Applicant Tracking Systems and specific job descriptions.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: "📝",
    title: "Cover Letter Generator",
    description:
      "Create personalized, compelling cover letters tailored to each job in seconds.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: "💼",
    title: "LinkedIn Optimizer",
    description:
      "Transform your LinkedIn profile into a recruiter magnet with AI-powered suggestions.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: "🔔",
    title: "Internship Alerts",
    description:
      "Get notified instantly when new opportunities match your profile and preferences.",
    color: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "85%", label: "Average score improvement" },
  { value: "3x", label: "More interview callbacks" },
  { value: "10K+", label: "Resumes optimized" },
  { value: "< 30s", label: "Analysis time" },
];

const testimonials = [
  {
    quote:
      "Went from 0 callbacks to 5 interviews in 2 weeks after using Rezoomind.",
    author: "Sarah M.",
    role: "Software Engineer Intern @ Google",
  },
  {
    quote:
      "The ATS optimization feature alone is worth it. Finally getting past the bots!",
    author: "James K.",
    role: "Data Science Intern @ Meta",
  },
  {
    quote:
      "My resume score jumped from 45 to 92. The feedback was incredibly specific.",
    author: "Emily R.",
    role: "Product Design Intern @ Stripe",
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-24 pb-20">
        <div className="relative overflow-hidden">
          <BackgroundMotion />
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Hook Badge */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 text-sm font-medium text-cyan-700 ring-1 ring-cyan-200"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              AI-Powered Resume Analysis
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="max-w-4xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Stop getting{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                rejected
              </span>
              .{" "}
              <br className="hidden sm:block" />
              Start getting{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                interviews
              </span>
              .
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            >
              Rezoomind analyzes your resume with AI, scores it against ATS
              systems, and gives you specific fixes to land more interviews.
              Join 10,000+ students who improved their resumes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <Button href="/signup" variant="primary" className="text-base px-8 py-4">
                Analyze My Resume Free
              </Button>
              <Button href="#how-it-works" variant="secondary" className="text-base px-8 py-4">
                See How It Works
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-white"
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">10,000+</span>{" "}
                students improved their resumes this month
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              <span>😰</span> The Problem
            </div>
            <h3 className="mb-6 text-2xl font-bold text-slate-900">
              Your resume is getting rejected
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    ✕
                  </span>
                  <span className="text-slate-700">{problem}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <span>🎯</span> The Solution
            </div>
            <h3 className="mb-6 text-2xl font-bold text-slate-900">
              Rezoomind fixes all of that
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    ✓
                  </span>
                  <span className="text-slate-700">{solution}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-white sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Get interview-ready in 3 simple steps
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Upload Your Resume",
              description:
                "Drop your PDF or paste your resume text. Our AI processes it in seconds.",
              icon: "📄",
            },
            {
              step: "2",
              title: "Get AI Analysis",
              description:
                "Receive a detailed score and specific feedback on what to improve.",
              icon: "✨",
            },
            {
              step: "3",
              title: "Apply Improvements",
              description:
                "One-click improvements and ATS optimization to land more interviews.",
              icon: "🚀",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl">
                {item.icon}
              </div>
              <div className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                {item.step}
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="text-slate-600">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button href="/signup" variant="primary" className="text-base px-8 py-4">
            Start Free Analysis
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to land your dream internship
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-2xl`}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
            Success Stories
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Students love Rezoomind
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
            >
              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400">
                    ★
                  </span>
                ))}
              </div>
              <p className="mb-4 text-slate-700">&ldquo;{testimonial.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-slate-900">
                  {testimonial.author}
                </p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Job Alerts Feature */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left: Feature Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 rounded-full text-sm font-semibold text-cyan-700 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                </span>
                New Feature
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Personalized Job Alerts
                <br />
                <span className="text-cyan-600">Delivered to Your Inbox</span>
              </h2>

              <p className="text-lg text-slate-600 mb-6">
                Set your preferences once and receive weekly emails with internships perfectly matched to your interests.
                No more endless scrolling through job boards.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">500+ New Jobs Daily</p>
                    <p className="text-sm text-slate-600">Scraped from LinkedIn, Indeed, ZipRecruiter & more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Smart Matching</p>
                    <p className="text-sm text-slate-600">Filtered by role, location, and your keywords</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Weekly Digest</p>
                    <p className="text-sm text-slate-600">Top 10 matches delivered every Monday morning</p>
                  </div>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/preferences"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all text-center"
                >
                  Set My Preferences
                </Link>
                <Link
                  href="/jobs"
                  className="px-8 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-cyan-500 transition-all text-center"
                >
                  Browse Jobs
                </Link>
              </div>
            </motion.div>

            {/* Right: Visual/Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 border-2 border-cyan-200"
            >
              <div className="space-y-6">
                {/* Stat Card 1 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">📊</span>
                    <span className="text-3xl font-bold text-cyan-600">500+</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">New jobs added daily</p>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">📧</span>
                    <span className="text-3xl font-bold text-purple-600">10K+</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Weekly emails sent</p>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">🎯</span>
                    <span className="text-3xl font-bold text-pink-600">85%</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Match accuracy rate</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-8 text-center text-sm font-medium text-slate-500">
            Our users have landed internships at
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* Pricing */}
      <Suspense
        fallback={
          <section
            id="pricing"
            className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20"
          >
            <div className="max-w-md space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <p className="text-sm text-slate-600">Loading pricing...</p>
            </div>
          </section>
        }
      >
        <Pricing />
      </Suspense>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-cyan-600 to-blue-700 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to stop getting rejected?
            </h2>
            <p className="mt-4 text-lg text-cyan-100">
              Join 10,000+ students who improved their resumes with AI.
              <br />
              Your dream internship is waiting.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-cyan-700 shadow-lg transition-all hover:bg-cyan-50 hover:shadow-xl"
              >
                Analyze My Resume Free
              </Link>
              <p className="text-sm text-cyan-200">
                No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
