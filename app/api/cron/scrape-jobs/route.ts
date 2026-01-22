import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run Python scraper script
    const python = spawn('python3', ['scripts/scrape_jobs.py'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || `Script failed with code ${code}`));
        } else {
          resolve();
        }
      });
    });

    console.log('JobSpy output:', output);

    return NextResponse.json({
      success: true,
      output: output,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
