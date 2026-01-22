'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const ROLE_OPTIONS = [
  { value: 'swe', label: 'Software Engineering', icon: '💻' },
  { value: 'ml', label: 'Machine Learning / AI', icon: '🤖' },
  { value: 'data', label: 'Data Science', icon: '📊' },
  { value: 'frontend', label: 'Frontend Development', icon: '🎨' },
  { value: 'backend', label: 'Backend Development', icon: '⚙️' },
  { value: 'fullstack', label: 'Full Stack', icon: '🔧' },
  { value: 'mobile', label: 'Mobile Development', icon: '📱' },
  { value: 'devops', label: 'DevOps / SRE', icon: '☁️' },
];

const LOCATION_OPTIONS = [
  { value: 'San Francisco, CA', emoji: '🌁' },
  { value: 'New York, NY', emoji: '🗽' },
  { value: 'Seattle, WA', emoji: '🌲' },
  { value: 'Austin, TX', emoji: '🤠' },
  { value: 'Boston, MA', emoji: '🎓' },
  { value: 'Los Angeles, CA', emoji: '🌴' },
  { value: 'Chicago, IL', emoji: '🏙️' },
  { value: 'Remote', emoji: '🌍' },
];

export default function PreferencesPage() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      await loadPreferences(user.id);
    }
    setInitialLoading(false);
  };

  const loadPreferences = async (userId: string) => {
    const { data } = await supabase
      .from('user_job_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSelectedRoles(data.interested_roles || []);
      setSelectedLocations(data.preferred_locations || []);
      setKeywords((data.keywords || []).join(', '));
    }
  };

  const handleSave = async () => {
    if (!user) {
      router.push('/login?redirect=/preferences');
      return;
    }

    setLoading(true);
    setSaved(false);

    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const { error } = await supabase
      .from('user_job_preferences')
      .upsert({
        user_id: user.id,
        interested_roles: selectedRoles,
        preferred_locations: selectedLocations,
        keywords: keywordArray,
        updated_at: new Date().toISOString(),
      });

    setLoading(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(l => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Set Your Job Preferences
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Tell us what you&apos;re looking for and we&apos;ll send you personalized internship alerts every week
          </p>
        </motion.div>

        {/* Roles Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Interested Roles
              </h2>
              <p className="text-sm text-slate-600">
                Select all roles you&apos;re interested in
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLE_OPTIONS.map(role => (
              <button
                key={role.value}
                onClick={() => toggleRole(role.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedRoles.includes(role.value)
                    ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-cyan-300'
                }`}
              >
                <span className="text-3xl">{role.icon}</span>
                <span className="font-semibold text-slate-900 text-left flex-1">
                  {role.label}
                </span>
                {selectedRoles.includes(role.value) && (
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {selectedRoles.length === 0 && (
            <p className="mt-4 text-sm text-red-600">
              * Please select at least one role
            </p>
          )}
        </motion.div>

        {/* Locations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Preferred Locations
              </h2>
              <p className="text-sm text-slate-600">
                Where do you want to work?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LOCATION_OPTIONS.map(location => (
              <button
                key={location.value}
                onClick={() => toggleLocation(location.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedLocations.includes(location.value)
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <span className="text-3xl">{location.emoji}</span>
                <span className="font-semibold text-slate-900 text-sm text-center">
                  {location.value}
                </span>
                {selectedLocations.includes(location.value) && (
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {selectedLocations.length === 0 && (
            <p className="mt-4 text-sm text-red-600">
              * Please select at least one location
            </p>
          )}
        </motion.div>

        {/* Keywords Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Keywords (Optional)
              </h2>
              <p className="text-sm text-slate-600">
                Add specific skills, technologies, or companies
              </p>
            </div>
          </div>

          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., Python, React, AI, Startup, Series A"
            className="w-full px-6 py-4 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
          />
          <p className="mt-3 text-sm text-slate-500">
            Separate multiple keywords with commas
          </p>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleSave}
            disabled={loading || selectedRoles.length === 0 || selectedLocations.length === 0}
            className={`w-full py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            }`}
          >
            {saved ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Saved Successfully!
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {loading ? 'Saving...' : 'Save Preferences'}
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-600 mt-4">
            You&apos;ll receive personalized job alerts every Monday morning
          </p>
        </motion.div>
      </div>
    </div>
  );
}
