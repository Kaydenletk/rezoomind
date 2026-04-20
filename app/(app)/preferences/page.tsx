'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from "next-auth/react";
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase, MapPin, Tags, Save, CheckCircle,
  Loader2, ArrowLeft, Sparkles, Mail,
} from 'lucide-react';

type AuthMode = 'authenticated' | 'subscriber' | 'loading';

type RoleOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
};

type LocationOption = {
  value: string;
  emoji: string;
  label: string;
};

type SessionUser = { id?: string | null; email?: string | null; name?: string | null };

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'software_engineer', label: 'Software Engineering', icon: '💻', description: 'Full-stack, backend, frontend' },
  { value: 'machine_learning', label: 'Machine Learning / AI', icon: '🤖', description: 'ML engineer, AI researcher' },
  { value: 'data_science', label: 'Data Science', icon: '📊', description: 'Data analyst, data engineer' },
  { value: 'product_management', label: 'Product Management', icon: '📱', description: 'PM, APM, technical PM' },
  { value: 'design', label: 'Design', icon: '🎨', description: 'UI/UX, product design' },
  { value: 'mobile', label: 'Mobile Development', icon: '📲', description: 'iOS, Android, React Native' },
  { value: 'devops', label: 'DevOps / SRE', icon: '☁️', description: 'Cloud, infrastructure, reliability' },
  { value: 'security', label: 'Security', icon: '🔒', description: 'Cybersecurity, InfoSec' },
];

const LOCATION_OPTIONS: LocationOption[] = [
  { value: 'San Francisco, CA', emoji: '🌁', label: 'San Francisco' },
  { value: 'New York, NY', emoji: '🗽', label: 'New York' },
  { value: 'Seattle, WA', emoji: '🌲', label: 'Seattle' },
  { value: 'Austin, TX', emoji: '🤠', label: 'Austin' },
  { value: 'Boston, MA', emoji: '🎓', label: 'Boston' },
  { value: 'Los Angeles, CA', emoji: '🌴', label: 'Los Angeles' },
  { value: 'Chicago, IL', emoji: '🏙️', label: 'Chicago' },
  { value: 'Denver, CO', emoji: '⛰️', label: 'Denver' },
  { value: 'Remote', emoji: '🌍', label: 'Remote' },
  { value: 'Hybrid', emoji: '🏠', label: 'Hybrid' },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

function LoadingView({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[calc(100vh-4rem)] bg-surface flex items-center justify-center"
    >
      <div className="text-center font-mono">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto mb-4" aria-hidden="true" />
        <p className="text-sm text-fg-muted">{label}</p>
      </div>
    </div>
  );
}

function PreferencesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [authMode, setAuthMode] = useState<AuthMode>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [subscriberEmail, setSubscriberEmail] = useState<string>('');

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    async function load() {
      setLoading(true);

      if (session?.user) {
        setAuthMode('authenticated');
        setUser(session.user as SessionUser);
        try {
          const response = await fetch('/api/preferences/data');
          const { prefs } = await response.json();
          if (prefs) {
            setSelectedRoles(prefs.interested_roles || []);
            setSelectedLocations(prefs.preferred_locations || []);
            setKeywords((prefs.keywords || []).join(', '));
          }
        } catch {
          // Non-fatal — leave inputs empty so the user can set fresh prefs.
        }
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const res = await fetch(`/api/subscriber/preferences?token=${token}`);
          const data = await res.json();
          if (data.ok) {
            setAuthMode('subscriber');
            setSubscriberEmail(data.preferences.email);
            setSelectedRoles(data.preferences.roles || []);
            setSelectedLocations(data.preferences.locations || []);
            setKeywords((data.preferences.keywords || []).join(', '));
            setLoading(false);
            return;
          }
        } catch {
          // fall through to redirect
        }
      }

      router.push('/?subscribe=true');
    }

    load();
  }, [token, status, session, router]);

  async function handleSave() {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role.');
      return;
    }
    if (selectedLocations.length === 0) {
      setError('Please select at least one location.');
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);

    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      if (authMode === 'authenticated' && user) {
        const res = await fetch('/api/preferences/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interested_roles: selectedRoles,
            preferred_locations: selectedLocations,
            keywords: keywordArray,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError('Failed to save preferences. Please try again.');
          return;
        }
      } else if (authMode === 'subscriber' && token) {
        const res = await fetch(`/api/subscriber/preferences?token=${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roles: selectedRoles,
            locations: selectedLocations,
            keywords: keywordArray,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error || 'Failed to save preferences.');
          return;
        }
      }

      setSaved(true);
      setTimeout(() => router.push('/jobs'), 1500);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
    setError('');
  }

  function toggleLocation(location: string) {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location],
    );
    setError('');
  }

  if (loading || authMode === 'loading') {
    return <LoadingView label="loading preferences..." />;
  }

  const canSave =
    !saving && selectedRoles.length > 0 && selectedLocations.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-fg font-mono">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035] dark:opacity-[0.05] text-fg"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          aria-label="Go back"
          className={`inline-flex items-center gap-2 text-fg-muted hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-8 font-mono text-xs ${focusRing}`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>~/back</span>
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 border border-orange-600/60 bg-orange-600/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400 font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>personalized_matching</span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            ~/preferences
          </p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            set job preferences
          </h1>
          <p className="mt-3 max-w-prose text-sm text-fg-muted">
            Tell us what you&apos;re looking for and we&apos;ll match internships to your profile.
          </p>

          {authMode === 'subscriber' && subscriberEmail ? (
            <div className="mt-4 inline-flex items-center gap-2 border border-status-success/50 bg-status-success/10 px-3 py-1.5 text-[11px] font-mono text-status-success">
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>signed_in_as: {subscriberEmail}</span>
            </div>
          ) : null}
        </motion.header>

        {/* Roles */}
        <motion.section
          aria-labelledby="roles-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="border border-line bg-surface-raised p-6 sm:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-orange-600/60 bg-orange-600/10 text-orange-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="roles-heading" className="text-xl font-bold font-mono">
                interested_roles
              </h2>
              <p className="text-xs text-fg-muted">
                Select all roles you&apos;re interested in (min 1)
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-labelledby="roles-heading"
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {ROLE_OPTIONS.map((role) => {
              const selected = selectedRoles.includes(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  aria-pressed={selected}
                  className={`flex items-start gap-4 p-4 border text-left transition-colors ${focusRing} ${
                    selected
                      ? 'border-orange-600 bg-orange-600/10'
                      : 'border-line bg-surface hover:border-orange-600/60'
                  }`}
                >
                  <span aria-hidden="true" className="text-3xl">
                    {role.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-fg text-sm">
                        {role.label}
                      </span>
                      {selected ? (
                        <CheckCircle
                          className="w-4 h-4 text-orange-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-fg-muted">
                      {role.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Locations */}
        <motion.section
          aria-labelledby="locations-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-line bg-surface-raised p-6 sm:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-orange-600/60 bg-orange-600/10 text-orange-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="locations-heading" className="text-xl font-bold font-mono">
                preferred_locations
              </h2>
              <p className="text-xs text-fg-muted">
                Where do you want to work? (min 1)
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-labelledby="locations-heading"
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {LOCATION_OPTIONS.map((location) => {
              const selected = selectedLocations.includes(location.value);
              return (
                <button
                  key={location.value}
                  type="button"
                  onClick={() => toggleLocation(location.value)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-2 p-4 border transition-colors ${focusRing} ${
                    selected
                      ? 'border-orange-600 bg-orange-600/10'
                      : 'border-line bg-surface hover:border-orange-600/60'
                  }`}
                >
                  <span aria-hidden="true" className="text-3xl">
                    {location.emoji}
                  </span>
                  <span className="font-bold text-fg text-xs text-center leading-tight">
                    {location.label}
                  </span>
                  {selected ? (
                    <CheckCircle
                      className="w-4 h-4 text-orange-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Keywords */}
        <motion.section
          aria-labelledby="keywords-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="border border-line bg-surface-raised p-6 sm:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-orange-600/60 bg-orange-600/10 text-orange-600 flex items-center justify-center">
              <Tags className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="keywords-heading" className="text-xl font-bold font-mono">
                keywords
                <span className="text-fg-subtle font-normal text-sm"> (optional)</span>
              </h2>
              <p className="text-xs text-fg-muted">
                Skills, technologies, or companies to refine matches
              </p>
            </div>
          </div>

          <div className="flex border-b border-line focus-within:border-orange-600">
            <span aria-hidden="true" className="py-2 pr-2 text-sm text-orange-600">
              {'>'}
            </span>
            <input
              id="keywords-input"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., Python, React, AI, Series A"
              aria-labelledby="keywords-heading"
              className="w-full bg-transparent py-2 text-sm font-mono text-fg placeholder:text-fg-subtle focus:outline-none"
            />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            separate with commas
          </p>
        </motion.section>

        {error ? (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 border border-status-error/50 bg-status-error/10 text-status-error text-sm font-mono flex items-center gap-2"
          >
            <span aria-hidden="true">✗</span>
            <span>{error}</span>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            aria-live="polite"
            className={`w-full py-4 font-bold font-mono text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${focusRing} ${
              saved
                ? 'border border-status-success/50 bg-status-success/10 text-status-success'
                : canSave
                ? 'border border-orange-600/60 bg-orange-600/10 text-orange-700 dark:text-orange-400 hover:bg-orange-600/20'
                : 'border border-line text-fg-subtle cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                <span>saved — redirecting to jobs...</span>
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                <span>save_preferences →</span>
              </>
            )}
          </button>

          <div className="text-center space-y-1">
            <p className="text-xs text-fg-muted">
              Personalized job alerts delivered every Monday
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
              selected: {selectedRoles.length} roles · {selectedLocations.length} locations
            </p>
          </div>

          {authMode === 'subscriber' ? (
            <div className="mt-6 p-6 border border-orange-600/40 bg-orange-600/5 text-center">
              <h3 className="text-base font-bold font-mono mb-2">
                want 3 free AI resume analyses?
              </h3>
              <p className="text-xs text-fg-muted mb-4">
                Create a free account to unlock RezoomAI — resume analysis, cover letters, and more.
              </p>
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className={`inline-flex px-5 py-2.5 border border-orange-600/60 bg-orange-600/10 text-orange-700 dark:text-orange-400 font-bold font-mono text-xs hover:bg-orange-600/20 transition-colors ${focusRing}`}
              >
                create_account →
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<LoadingView label="loading preferences..." />}>
      <PreferencesContent />
    </Suspense>
  );
}
