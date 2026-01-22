"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";

interface UserProgress {
  hasResume: boolean;
  hasAnalyzed: boolean;
  hasImproved: boolean;
  resumeScore: number | null;
}

interface UserStats {
  resumesCreated: number;
  analysesRun: number;
  avgScore: number;
  daysActive: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; created_at?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({
    hasResume: false,
    hasAnalyzed: false,
    hasImproved: false,
    resumeScore: null,
  });
  const [stats, setStats] = useState<UserStats>({
    resumesCreated: 0,
    analysesRun: 0,
    avgScore: 0,
    daysActive: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?next=/dashboard");
      return;
    }

    setUser(user);

    // Check progress from resumes table
    const { data: resumes } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (resumes && resumes.length > 0) {
      setProgress({
        hasResume: true,
        hasAnalyzed: resumes.some((r) => r.analysis !== null),
        hasImproved: resumes.some((r) => r.improved_text !== null),
        resumeScore: resumes[0]?.score || null,
      });

      const scores = resumes.filter((r) => r.score).map((r) => r.score as number);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      setStats({
        resumesCreated: resumes.length,
        analysesRun: resumes.filter((r) => r.analysis).length,
        avgScore,
        daysActive: Math.ceil(
          (Date.now() - new Date(user.created_at || Date.now()).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      });
    }

    setLoading(false);
  };

  const steps = [
    {
      id: 1,
      title: "Upload Your Resume",
      description: "Start by uploading your current resume (PDF or paste text)",
      completed: progress.hasResume,
      action: "/resume",
      actionText: progress.hasResume ? "View Resume" : "Upload Resume",
      icon: "📄",
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: 2,
      title: "Get AI Analysis",
      description: "Receive detailed feedback and a 0-100 score",
      completed: progress.hasAnalyzed,
      action: "/resume/analysis",
      actionText: progress.hasAnalyzed ? "View Analysis" : "Analyze Now",
      icon: "✨",
      color: "from-purple-500 to-pink-500",
      disabled: !progress.hasResume,
    },
    {
      id: 3,
      title: "Improve & Apply",
      description: "Apply AI improvements and start landing interviews",
      completed: progress.hasImproved,
      action: "/resume/analysis",
      actionText: "Improve Resume",
      icon: "🚀",
      color: "from-pink-500 to-rose-500",
      disabled: !progress.hasAnalyzed,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.email?.split("@")[0] || "there"}!
          </h1>
          <p className="text-lg text-slate-600">
            Let&apos;s get you interview-ready in 3 simple steps
          </p>
        </motion.div>

        {/* Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
        >
          <StatCard
            label="Resume Score"
            value={progress.resumeScore ? `${progress.resumeScore}/100` : "N/A"}
            icon="📊"
            color="text-blue-600"
          />
          <StatCard
            label="Resumes"
            value={stats.resumesCreated}
            icon="📄"
            color="text-purple-600"
          />
          <StatCard
            label="AI Analyses"
            value={stats.analysesRun}
            icon="🤖"
            color="text-pink-600"
          />
          <StatCard
            label="Days Active"
            value={stats.daysActive}
            icon="🔥"
            color="text-orange-600"
          />
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Your Progress
              </h3>
              <span className="text-sm font-medium text-slate-600">
                {completedSteps} of {steps.length} complete
              </span>
            </div>
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <StepCard key={step.id} step={step} delay={0.3 + index * 0.1} />
          ))}
        </div>

        {/* Quick Actions - Show when all steps complete */}
        {completedSteps === steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              You&apos;re all set!
            </h3>
            <p className="text-slate-700 mb-6">
              Your resume is optimized and ready. Here&apos;s what you can do next:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <QuickAction
                title="Generate Cover Letter"
                description="Create a personalized cover letter"
                href="/resume/analysis"
              />
              <QuickAction
                title="Find Internships"
                description="Browse matched opportunities"
                href="/matches"
              />
              <QuickAction
                title="Set Alerts"
                description="Get notified of new matches"
                href="/interests"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl md:text-3xl">{icon}</span>
        <span className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-xs md:text-sm text-slate-600 font-medium">{label}</p>
    </div>
  );
}

function StepCard({
  step,
  delay,
}: {
  step: {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    action: string;
    actionText: string;
    icon: string;
    color: string;
    disabled?: boolean;
  };
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`relative ${step.disabled ? "opacity-50" : ""}`}
    >
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-shadow">
        <div className="flex items-start gap-4 md:gap-6">
          {/* Step Icon */}
          <div
            className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-2xl md:text-3xl shadow-lg`}
          >
            {step.icon}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                {step.title}
              </h3>
              {step.completed && (
                <span className="text-green-500 text-xl">✓</span>
              )}
            </div>
            <p className="text-slate-600 mb-4 text-sm md:text-base">
              {step.description}
            </p>

            <Link
              href={step.disabled ? "#" : step.action}
              className={`inline-block px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all ${
                step.disabled
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : step.completed
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:scale-105"
              }`}
            >
              {step.actionText}
            </Link>
          </div>

          {/* Step Number */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
              {step.id}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white rounded-xl border border-green-200 hover:border-green-400 hover:shadow-lg transition-all"
    >
      <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}
