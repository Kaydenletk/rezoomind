import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const resend = new Resend(resendApiKey);

  try {
    // Get all users with job preferences who want weekly emails
    const { data: usersWithPrefs, error: prefsError } = await supabase
      .from('user_job_preferences')
      .select(`
        user_id,
        interested_roles,
        preferred_locations,
        keywords,
        email_frequency
      `)
      .eq('email_frequency', 'weekly');

    if (prefsError) {
      throw new Error(`Failed to fetch preferences: ${prefsError.message}`);
    }

    if (!usersWithPrefs || usersWithPrefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with weekly email preferences',
        emailsSent: 0,
      });
    }

    // Get recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentJobs, error: jobsError } = await supabase
      .from('job_postings')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const userPref of usersWithPrefs) {
      try {
        // Get user email from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userPref.user_id)
          .single();

        if (!profile?.email) continue;

        // Match jobs to user preferences
        const matchedJobs = matchJobsToPreferences(
          recentJobs || [],
          userPref.interested_roles || [],
          userPref.preferred_locations || [],
          userPref.keywords || []
        );

        if (matchedJobs.length === 0) continue;

        // Take top 10 matches
        const topJobs = matchedJobs.slice(0, 10);

        // Generate email HTML
        const emailHtml = generateDigestEmail(topJobs, profile.email);

        // Send email
        await resend.emails.send({
          from: 'Rezoomind <jobs@rezoomind.com>',
          to: profile.email,
          subject: `🎯 ${topJobs.length} New Internships Matching Your Preferences`,
          html: emailHtml,
        });

        // Update last_email_sent
        await supabase
          .from('user_job_preferences')
          .update({ last_email_sent: new Date().toISOString() })
          .eq('user_id', userPref.user_id);

        emailsSent++;
      } catch (err) {
        const error = err as Error;
        errors.push(`User ${userPref.user_id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: usersWithPrefs.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Digest error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

interface Job {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
}

function matchJobsToPreferences(
  jobs: Job[],
  roles: string[],
  locations: string[],
  keywords: string[]
): Job[] {
  if (roles.length === 0 && locations.length === 0 && keywords.length === 0) {
    return jobs;
  }

  return jobs
    .map(job => {
      let score = 0;

      // Check role match
      if (roles.length > 0 && job.tags) {
        const roleMatch = roles.some(role =>
          job.tags!.some(tag => tag.toLowerCase().includes(role.toLowerCase())) ||
          job.role.toLowerCase().includes(role.toLowerCase())
        );
        if (roleMatch) score += 3;
      }

      // Check location match
      if (locations.length > 0 && job.location) {
        const locationMatch = locations.some(loc =>
          job.location!.toLowerCase().includes(loc.toLowerCase()) ||
          (loc.toLowerCase() === 'remote' && job.location!.toLowerCase().includes('remote'))
        );
        if (locationMatch) score += 2;
      }

      // Check keyword match
      if (keywords.length > 0) {
        const keywordMatch = keywords.some(keyword =>
          job.role.toLowerCase().includes(keyword.toLowerCase()) ||
          job.company.toLowerCase().includes(keyword.toLowerCase())
        );
        if (keywordMatch) score += 1;
      }

      return { job, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ job }) => job);
}

function generateDigestEmail(jobs: Job[], userEmail: string): string {
  const jobsHtml = jobs.map(job => `
    <tr>
      <td style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">${job.role}</h3>
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
          <strong>${job.company}</strong>${job.location ? ` • ${job.location}` : ''}
        </p>
        ${job.salary_min ? `<p style="margin: 0 0 12px 0; color: #059669; font-size: 14px;">$${(job.salary_min / 1000).toFixed(0)}K${job.salary_max ? ` - $${(job.salary_max / 1000).toFixed(0)}K` : '+'}</p>` : ''}
        ${job.url ? `<a href="${job.url}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(to right, #06b6d4, #2563eb); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Apply Now</a>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
          <td style="padding: 40px 20px; background: linear-gradient(to right, #06b6d4, #2563eb); text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">Rezoomind</h1>
            <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">Your Weekly Job Digest</p>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding: 30px 20px 20px 20px;">
            <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.6;">
              Hey there! 👋<br><br>
              We found <strong>${jobs.length} internship opportunities</strong> matching your preferences this week. Check them out below!
            </p>
          </td>
        </tr>

        <!-- Jobs -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${jobsHtml}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding: 30px 20px; text-align: center;">
            <a href="https://rezoomind.com/jobs" style="display: inline-block; padding: 16px 32px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
              View All Jobs
            </a>
          </td>
        </tr>

        <!-- Resume CTA -->
        <tr>
          <td style="padding: 20px; background-color: #f0fdfa; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #0f766e; font-size: 16px; font-weight: 600;">
              Ready to apply? Make sure your resume is optimized!
            </p>
            <a href="https://rezoomind.com/resume" style="display: inline-block; padding: 12px 24px; border: 2px solid #14b8a6; color: #0f766e; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Analyze My Resume
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 30px 20px; background-color: #f8fafc; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px;">
              You're receiving this because you subscribed to job alerts.
            </p>
            <a href="https://rezoomind.com/preferences" style="color: #64748b; font-size: 12px;">Update preferences</a>
            <span style="color: #cbd5e1;"> | </span>
            <a href="https://rezoomind.com/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color: #64748b; font-size: 12px;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
