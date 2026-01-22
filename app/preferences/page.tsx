'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Briefcase, MapPin, Tags, Save, CheckCircle,
  Loader2, ArrowLeft, Sparkles
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'software_engineer', label: 'Software Engineering', icon: '💻', description: 'Full-stack, backend, frontend' },
  { value: 'machine_learning', label: 'Machine Learning / AI', icon: '🤖', description: 'ML engineer, AI researcher' },
  { value: 'data_science', label: 'Data Science', icon: '📊', description: 'Data analyst, data engineer' },
  { value: 'product_management', label: 'Product Management', icon: '📱', description: 'PM, APM, technical PM' },
  { value: 'design', label: 'Design', icon: '🎨', description: 'UI/UX, product design' },
  { value: 'mobile', label: 'Mobile Development', icon: '📲', description: 'iOS, Android, React Native' },
  { value: 'devops', label: 'DevOps / SRE', icon: '☁️', description: 'Cloud, infrastructure, reliability' },
  { value: 'security', label: 'Security', icon: '🔒', description: 'Cybersecurity, InfoSec' },
];

const LOCATION_OPTIONS = [
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

export default function PreferencesPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    loadUserAndPreferences();
  }, []);

  const loadUserAndPreferences = async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push('/login?redirect=/preferences');
      return;
    }

    setUser(user);

    const { data: prefs, error: prefsError } = await supabase
      .from('user_job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (prefs && !prefsError) {
      setSelectedRoles(prefs.interested_roles || []);
      setSelectedLocations(prefs.preferred_locations || []);
      setKeywords((prefs.keywords || []).join(', '));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    if (selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);

    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const { error: saveError } = await supabase
      .from('user_job_preferences')
      .upsert({
        user_id: user.id,
        interested_roles: selectedRoles,
        preferred_locations: selectedLocations,
        keywords: keywordArray,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    setSaving(false);

    if (saveError) {
      console.error('Save error:', saveError);
      setError('Failed to save preferences. Please try again.');
    } else {
      setSaved(true);
      setTimeout(() => {
        router.push('/jobs');
      }, 2000);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
    setError('');
  };

  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(l => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full text-sm font-semibold text-cyan-700 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Personalized Job Matching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Set Your Job Preferences
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Tell us what you&apos;re looking for and we&apos;ll match you with the perfect internships every week
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
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Interested Roles
              </h2>
              <p className="text-sm text-slate-600">
                Select all roles you&apos;re interested in (choose at least 1)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLE_OPTIONS.map(role => (
              <button
                key={role.value}
                onClick={() => toggleRole(role.value)}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                  selectedRoles.includes(role.value)
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md'
                }`}
              >
                <span className="text-4xl">{role.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{role.label}</span>
                    {selectedRoles.includes(role.value) && (
                      <CheckCircle className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{role.description}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedRoles.length === 0 && (
            <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>Please select at least one role</span>
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Preferred Locations
              </h2>
              <p className="text-sm text-slate-600">
                Where do you want to work? (choose at least 1)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {LOCATION_OPTIONS.map(location => (
              <button
                key={location.value}
                onClick={() => toggleLocation(location.value)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  selectedLocations.includes(location.value)
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-[1.05]'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <span className="text-4xl">{location.emoji}</span>
                <span className="font-bold text-slate-900 text-sm text-center leading-tight">
                  {location.label}
                </span>
                {selectedLocations.includes(location.value) && (
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                )}
              </button>
            ))}
          </div>

          {selectedLocations.length === 0 && (
            <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>Please select at least one location</span>
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
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Tags className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Keywords (Optional)
              </h2>
              <p className="text-sm text-slate-600">
                Add specific skills, technologies, or companies to refine your matches
              </p>
            </div>
          </div>

          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., Python, React, AI, Startup, Series A, Google"
            className="w-full px-6 py-4 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
          />
          <p className="mt-3 text-sm text-slate-500">
            Separate multiple keywords with commas
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
          >
            <span className="text-2xl">⚠️</span>
            <p className="text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <button
            onClick={handleSave}
            disabled={saving || selectedRoles.length === 0 || selectedLocations.length === 0}
            className={`w-full py-6 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
              saved
                ? 'bg-green-500 text-white shadow-xl'
                : saving
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : selectedRoles.length === 0 || selectedLocations.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-6 h-6" />
                Saved! Redirecting to jobs...
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Save Preferences & See Matched Jobs
              </>
            )}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">
              You&apos;ll receive personalized job alerts every Monday morning
            </p>
            <p className="text-xs text-slate-500">
              Selected: {selectedRoles.length} roles, {selectedLocations.length} locations
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
