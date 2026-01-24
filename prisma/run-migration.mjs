import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running email_subscribers migration...');

  try {
    // Create email_subscribers table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.email_subscribers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed')),
        interests jsonb,
        created_at timestamp with time zone DEFAULT now(),
        confirmed_at timestamp with time zone,
        confirm_token_hash text,
        confirm_token_expires_at timestamp with time zone,
        unsubscribe_token_hash text,
        updated_at timestamp with time zone DEFAULT now(),
        interested_roles text[] DEFAULT '{}',
        preferred_locations text[] DEFAULT '{}',
        keywords text[] DEFAULT '{}',
        weekly_limit integer DEFAULT 10,
        last_email_sent timestamp with time zone,
        preferences_token text UNIQUE
      )
    `);
    console.log('✓ Created email_subscribers table');

    // Create sent_subscriber_job_alerts table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.sent_subscriber_job_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id uuid REFERENCES public.email_subscribers(id) ON DELETE CASCADE NOT NULL,
        job_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
        sent_at timestamp with time zone DEFAULT now(),
        UNIQUE(subscriber_id, job_id)
      )
    `);
    console.log('✓ Created sent_subscriber_job_alerts table');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON public.email_subscribers(status)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_preferences_token ON public.email_subscribers(preferences_token)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_confirm_token_hash ON public.email_subscribers(confirm_token_hash)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_sent_subscriber_job_alerts_subscriber_id ON public.sent_subscriber_job_alerts(subscriber_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_sent_subscriber_job_alerts_job_id ON public.sent_subscriber_job_alerts(job_id)
    `);
    console.log('✓ Created indexes');

    console.log('\\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
