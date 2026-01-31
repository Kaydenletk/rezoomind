'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Stats {
  totalJobs: number;
  latestJob: {
    created_at: string;
    role: string;
    company: string;
    source: string;
  } | null;
  last24Hours: number;
  lastHour: number;
}

export default function DebugPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Check total jobs
    const { count: totalJobs } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true });

    // Check latest job
    const { data: latestJob } = await supabase
      .from('job_postings')
      .select('created_at, role, company, source')
      .order('created_at', { ascending: false })
      .limit(1);

    // Check jobs from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: last24Hours } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    // Check jobs from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: lastHour } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    setStats({
      totalJobs: totalJobs || 0,
      latestJob: latestJob?.[0] || null,
      last24Hours: last24Hours || 0,
      lastHour: lastHour || 0,
    });
  };

  const testCronJob = async () => {
    setTesting(true);
    setLogs(['Testing cron job...']);

    try {
      const response = await fetch('/api/cron/scrape-jobs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLogs(prev => [
          ...prev,
          `Success!`,
          `Scraped: ${data.scraped} jobs`,
          `Saved: ${data.saved} new jobs`,
          `Duplicates: ${data.duplicates}`,
          `Duration: ${data.duration}`,
          `Sources: ${JSON.stringify(data.sources, null, 2)}`,
        ]);
      } else {
        setLogs(prev => [
          ...prev,
          `Error: ${data.error}`,
          `Status: ${response.status}`,
        ]);
      }
    } catch (error) {
      setLogs(prev => [
        ...prev,
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }

    setTesting(false);
    setTimeout(loadStats, 2000);
  };

  const clearAllJobs = async () => {
    setTesting(true);
    setLogs(['Clearing all GitHub jobs...']);

    try {
      const response = await fetch('/api/admin/clear-jobs', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.ok) {
        setLogs(prev => [
          ...prev,
          `Cleared ${result.deleted} jobs.`,
          result.message || 'Ready for fresh sync.',
        ]);
      } else {
        setLogs(prev => [...prev, `Clear failed: ${result.error}`]);
      }
    } catch (error) {
      setLogs(prev => [
        ...prev,
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }

    setTesting(false);
    setTimeout(loadStats, 2000);
  };

  const syncFromGitHub = async () => {
    setTesting(true);
    setLogs(['Triggering server-side sync...']);

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.ok) {
        setLogs(prev => [
          ...prev,
          `✅ Sync successful!`,
          `Fetched: ${result.fetched} jobs`,
          `Upserted: ${result.upserted} jobs (fresh timestamps)`,
          `Emailed: ${result.emailed} subscribers`,
        ]);
      } else {
        setLogs(prev => [...prev, `❌ Sync failed: ${result.error}`]);
      }
    } catch (error) {
      setLogs(prev => [
        ...prev,
        `❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }

    setTesting(false);
    setTimeout(loadStats, 2000);
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading debug info...</p>
        </div>
      </div>
    );
  }

  const latestJobAge = stats.latestJob
    ? Math.floor((Date.now() - new Date(stats.latestJob.created_at).getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          Debug Dashboard
        </h1>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-200">
            <div className="text-3xl font-bold text-cyan-600 mb-2">
              {stats.totalJobs}
            </div>
            <p className="text-sm text-slate-600">Total Jobs</p>
          </div>

          <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
            stats.lastHour > 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              stats.lastHour > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.lastHour}
            </div>
            <p className="text-sm text-slate-600">Last Hour</p>
            {stats.lastHour === 0 && (
              <p className="text-xs text-red-600 mt-2">No hourly updates!</p>
            )}
          </div>

          <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
            stats.last24Hours > 50 ? 'border-green-500' : 'border-amber-500'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              stats.last24Hours > 50 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {stats.last24Hours}
            </div>
            <p className="text-sm text-slate-600">Last 24 Hours</p>
          </div>

          <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
            latestJobAge !== null && latestJobAge < 2 ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              latestJobAge !== null && latestJobAge < 2 ? 'text-green-600' : 'text-red-600'
            }`}>
              {latestJobAge !== null ? `${latestJobAge}h` : 'N/A'}
            </div>
            <p className="text-sm text-slate-600">Latest Job Age</p>
            {latestJobAge !== null && latestJobAge > 2 && (
              <p className="text-xs text-red-600 mt-2">Jobs are stale!</p>
            )}
          </div>
        </div>

        {/* Latest Job Info */}
        {stats.latestJob && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Latest Job</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Role:</span> {stats.latestJob.role}</p>
              <p><span className="font-semibold">Company:</span> {stats.latestJob.company}</p>
              <p><span className="font-semibold">Source:</span> {stats.latestJob.source}</p>
              <p><span className="font-semibold">Posted:</span> {new Date(stats.latestJob.created_at).toLocaleString()}</p>
              <p><span className="font-semibold">Age:</span> {latestJobAge} hours ago</p>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Manual Tests</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={clearAllJobs}
              disabled={testing}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {testing ? 'Clearing...' : 'Clear All Jobs'}
            </button>
            <button
              onClick={syncFromGitHub}
              disabled={testing}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {testing ? 'Syncing...' : 'Sync from GitHub'}
            </button>
            <button
              onClick={testCronJob}
              disabled={testing}
              className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Cron Job'}
            </button>
            <button
              onClick={loadStats}
              className="px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700"
            >
              Refresh Stats
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Click &quot;Clear All Jobs&quot; first, then &quot;Sync from GitHub&quot; to get fresh jobs
          </p>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Test Logs</h2>
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-8 bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Diagnostic Checklist</h2>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start gap-2">
              <span>{stats.lastHour > 0 ? 'OK' : 'FAIL'}</span>
              <span>Hourly updates working (should have jobs from last hour)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{stats.last24Hours > 50 ? 'OK' : 'WARN'}</span>
              <span>Daily volume adequate (should have 50+ jobs per day)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{latestJobAge !== null && latestJobAge < 2 ? 'OK' : 'FAIL'}</span>
              <span>Jobs are fresh (latest should be less than 2 hours old)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>INFO</span>
              <span>Source: speedyapply/2026-SWE-College-Jobs (GitHub)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
