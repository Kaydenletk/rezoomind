import { MatchExplanationStream } from '@/components/smart-feed/MatchExplanationStream';
import { CoverLetterStream } from '@/components/smart-feed/CoverLetterStream';

export default function TestStreamingPage() {
  // Mock data for testing
  const mockMatchData = {
    jobTitle: 'Senior Software Engineer',
    companyName: 'Stripe',
    overallScore: 82,
    skillMatch: 88,
    experienceMatch: 70,
    matchingSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    missingSkills: ['Go', 'Kubernetes'],
    resumeYears: 4,
    requiredYears: 5,
  };

  const mockCoverLetterData = {
    resumeText: `Software Engineer with 4 years of experience building web applications.

Skills: React, TypeScript, Node.js, PostgreSQL, AWS, Docker

Experience:
- Built and maintained a B2B SaaS platform serving 10,000+ users
- Led migration from monolith to microservices architecture
- Implemented real-time features using WebSockets
- Mentored junior developers and conducted code reviews

Education:
BS Computer Science, University of California, Berkeley`,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Stripe',
    jobDescription: `We're looking for a Senior Software Engineer to join our Dashboard team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in React and TypeScript
- Experience with backend systems (Go, Java, or similar)
- Familiarity with cloud infrastructure (AWS, GCP)
- Experience with relational databases

Nice to have:
- Experience with payment systems
- Kubernetes experience
- Open source contributions`,
    companyInfo: 'Stripe is a financial infrastructure platform for businesses.',
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 dark:bg-stone-950">
      <div className="mx-auto max-w-3xl space-y-12">
        <h1 className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
          Streaming AI Test
        </h1>

        {/* Match Explanation Test */}
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-stone-700 dark:text-stone-300">
            Match Explanation
          </h2>
          <div className="border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <MatchExplanationStream {...mockMatchData} />
          </div>
        </section>

        {/* Cover Letter Test */}
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-stone-700 dark:text-stone-300">
            Cover Letter Generator
          </h2>
          <div className="border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <CoverLetterStream {...mockCoverLetterData} />
          </div>
        </section>
      </div>
    </div>
  );
}
