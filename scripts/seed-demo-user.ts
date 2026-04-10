import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@rezoomind.app";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo_rezoomind_2026";

const DEMO_RESUME_TEXT = `Alex Chen | alex.chen@university.edu | linkedin.com/in/alexchen | github.com/alexchen

EDUCATION
University of California, Berkeley | B.S. Computer Science | GPA: 3.7 | May 2026

SKILLS
Languages: Python, TypeScript, JavaScript, Java, SQL, C++
Frameworks: React, Next.js, Node.js, Express, FastAPI, Django
Tools: Git, Docker, AWS, PostgreSQL, MongoDB, Redis
ML/AI: TensorFlow, PyTorch, pandas, numpy, scikit-learn

EXPERIENCE
Software Engineering Intern | Google | Summer 2024
- Built React dashboards reducing analyst report time by 40%
- Designed REST APIs using Node.js and PostgreSQL for internal tools
- Collaborated on ML pipeline using Python and TensorFlow for ad targeting

Software Engineering Intern | Stripe | Summer 2023
- Implemented TypeScript microservices processing 10K+ daily transactions
- Built monitoring dashboards with React and GraphQL
- Reduced API latency by 25% through Redis caching

PROJECTS
Full-Stack Job Matching Platform | Next.js, TypeScript, PostgreSQL, Gemini API
- Semantic job matching using Gemini embeddings + cosine similarity against 1,400+ job postings
- Streaming AI explanations via Vercel AI SDK v6

Open Source ML Visualization Library | Python, PyTorch, NumPy
- Published library with 500+ GitHub stars for neural network visualization
- 3 years of experience building production systems`;

async function main() {
  console.log("Seeding demo user...");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { password: hashedPassword, name: "Demo User" },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      password: hashedPassword,
    },
  });

  await prisma.resume.upsert({
    where: { userId: user.id },
    update: { resume_text: DEMO_RESUME_TEXT, embedding: [], resume_keywords: [] },
    create: {
      userId: user.id,
      resume_text: DEMO_RESUME_TEXT,
    },
  });

  console.log(`✓ Demo user seeded: ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
