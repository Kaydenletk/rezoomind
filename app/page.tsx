"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, CheckCircle, Sparkles, ArrowRight } from "lucide-react";

import { BackgroundMotion } from "@/components/BackgroundMotion";
import { Button } from "@/components/ui/Button";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Pricing } from "@/components/Pricing";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const problems = [
  "Your resume gets buried before a human ever sees it",
  "Generic bullet points that don't stand out",
  "No idea why you're not getting callbacks",
  "Hours spent tailoring — still no replies",
];

const solutions = [
  "Beat the ATS bots with AI-optimized formatting",
  "Impact-driven bullets that grab recruiters in seconds",
  "Clear score + specific feedback — no guessing",
  "One-click tailoring for any job description",
];

const features = [
  {
    icon: "🎯",
    title: "Resume Score & Feedback",
    description:
      "Get a clear 0–100 score with specific, actionable feedback on formatting, content, ATS compatibility, and impact.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: "✨",
    title: "Bullets That Get Callbacks",
    description:
      "Transform weak job descriptions into powerful, quantified achievements that stop a recruiter mid-scroll.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "🤖",
    title: "Beat the Resume Bots",
    description:
      "Automatically optimize your resume for ATS software and any specific job description — in one click.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: "📝",
    title: "Cover Letter in Seconds",
    description:
      "Generate personalized, compelling cover letters tailored to each company and role — no blank page ever.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: "💼",
    title: "LinkedIn That Recruits You",
    description:
      "Turn your LinkedIn profile into an inbound channel — AI suggestions that make recruiters reach out first.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: "🔔",
    title: "Matched Jobs in Your Inbox",
    description:
      "Receive your top 10 AI-matched internships every Monday — no scrolling, no missing deadlines.",
    color: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "85%", label: "Average score improvement" },
  { value: "3×", label: "More interview callbacks" },
  { value: "12,400+", label: "Students improved their resume" },
  { value: "< 30s", label: "Time to your first score" },
];

const testimonials = [
  {
    quote:
      "Went from 0 callbacks to 5 interviews in 2 weeks. The feedback was so specific I knew exactly what to fix.",
    author: "Sarah M.",
    role: "Software Engineer Intern @ Google",
    initials: "SM",
    color: "from-blue-500 to-cyan-500",
  },
  {
    quote:
      "Finally getting past the ATS bots. I was sending the same resume for months — one change and it clicked.",
    author: "James K.",
    role: "Data Science Intern @ Meta",
    initials: "JK",
    color: "from-purple-500 to-pink-500",
  },
  {
    quote:
      "My resume score jumped from 45 to 92. It's not just a score — the suggestions actually make sense.",
    author: "Emily R.",
    role: "Product Design Intern @ Stripe",
    initials: "ER",
    color: "from-emerald-500 to-teal-500",
  },
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus('loading');
    setSubscribeMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setSubscribeStatus('success');
        setSubscribeMessage('Check your email to confirm your subscription!');
        setEmail('');
      } else {
        setSubscribeStatus('error');
        setSubscribeMessage(data.error || 'Something went wrong');
      }
    } catch {
      setSubscribeStatus('error');
      setSubscribeMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero Section with Email Capture */}
      <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pt-24 pb-20">
        <div className="relative overflow-hidden">
          <BackgroundMotion />
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Hook Badge */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>100% Free · 10 Matched Jobs/Week · No Credit Card</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
            >
              Stop Guessing.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Start Getting Callbacks.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-4 max-w-2xl text-xl leading-relaxed text-slate-600"
            >
              Get <span className="font-bold text-slate-900">10 AI-matched SWE internships</span> delivered to your inbox every week — free forever. Plus, <span className="font-bold text-slate-900">analyze your resume with AI</span> before you even sign up.
            </motion.p>

            {/* Email Subscription Form */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-10 w-full max-w-2xl"
            >
              <form onSubmit={handleSubscribe} className="relative">
                <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-3 shadow-2xl border-2 border-slate-200">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      required
                      disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                      className="w-full pl-12 pr-4 py-4 text-lg border-0 focus:outline-none rounded-xl bg-slate-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {subscribeStatus === 'loading' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : subscribeStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Check your inbox!</span>
                      </>
                    ) : (
                      <>
                        <span>Send Me My Matches</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Subscribe Message */}
              {subscribeMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 text-sm font-medium ${
                    subscribeStatus === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {subscribeMessage}
                </motion.p>
              )}

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-5 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unsubscribe anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Join 10,000+ CS students</span>
                </div>
              </div>
              {/* Privacy microcopy */}
              <p className="mt-3 text-xs text-slate-400">We never share your email. Ever.</p>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex flex-col items-center gap-1"
            >
              <Button href="/signup" variant="secondary" className="text-sm px-5 py-2.5">
                Create Free Account
              </Button>
              <p className="text-xs text-slate-400">Unlock RezoomAI — keep it after your 5 free tries</p>
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
            className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
              <span>😓</span> Sound familiar?
            </div>
            <h3 className="mb-6 text-2xl font-bold text-slate-900">
              You&apos;re applying. Nobody&apos;s replying.
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-sm font-bold">
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
              <span>🎯</span> Here&apos;s what changes
            </div>
            <h3 className="mb-6 text-2xl font-bold text-slate-900">
              Rezoomind fixes every one of these
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">
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
          <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            Land interviews in 3 steps
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
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              Your internship toolkit, all in one place
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
          <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            Students getting callbacks, not silence
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-lg">
                    ★
                  </span>
                ))}
              </div>
              <p className="mb-6 text-slate-700 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.color} text-white text-sm font-bold`}>
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
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
                    <p className="text-sm text-slate-600">Sourced from verified company career pages</p>
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

      {/* Company Logos — moved up for early social proof */}
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

      {/* Final CTA with Email Form */}
      <section className="bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              You&apos;re one email away from 10 matched jobs.
            </h2>
            <p className="mt-4 text-xl text-cyan-100">
              Join 10,000+ CS students getting AI-matched internships every Monday
            </p>

            {/* Email Form */}
            <form onSubmit={handleSubscribe} className="mt-8 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-3 shadow-2xl">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                  className="flex-1 px-6 py-4 text-lg border-0 focus:outline-none rounded-xl"
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 transition-all whitespace-nowrap"
                >
                  {subscribeStatus === 'loading' ? 'Sending...' : 'Send Me My Matches'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-cyan-200 text-sm">
              100% free · No credit card · Unsubscribe anytime · We never share your email
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
