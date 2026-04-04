// scripts/seed-historical-snapshots.ts
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load env vars manually. Prisma auto-loads .env at import time, so .env.local
// must override (not skip) to match Next.js precedence: .env.local > .env
function loadEnv(filePath: string, override = false) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"), true);  // override Prisma's auto-loaded .env
loadEnv(resolve(process.cwd(), ".env"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Is .env.local present?");
  process.exit(1);
}

const REPO_URL = "https://github.com/speedyapply/2026-SWE-College-Jobs.git";
const CLONE_DIR = "/tmp/speedyapply-jobs";
const COUNT_REGEX = /\*\*(\d+)\*\* available/g;

const prisma = new PrismaClient();

async function main() {
  // 1. Clone repo if needed
  if (!existsSync(CLONE_DIR)) {
    console.log("Cloning speedyapply repo...");
    execSync(`git clone ${REPO_URL} ${CLONE_DIR}`, { stdio: "inherit" });
  } else {
    console.log("Repo already cloned, pulling latest...");
    execSync("git pull", { cwd: CLONE_DIR, stdio: "inherit" });
  }

  // 2. Get all commits with dates (oldest first)
  const logOutput = execSync(
    'git log --reverse --format="%h %ad" --date=short',
    { cwd: CLONE_DIR, encoding: "utf8" }
  );

  const lines = logOutput.trim().split("\n");

  // 3. Deduplicate by date (keep first commit per day)
  const commitsByDate = new Map<string, string>();
  for (const line of lines) {
    const [hash, date] = line.split(" ");
    if (!commitsByDate.has(date)) {
      commitsByDate.set(date, hash);
    }
  }

  console.log(`Found ${commitsByDate.size} unique days of data`);

  let upserted = 0;
  let skipped = 0;
  let failed = 0;

  const entries = Array.from(commitsByDate.entries());
  for (let i = 0; i < entries.length; i++) {
    const [date, hash] = entries[i];

    // 4. Extract README for this commit
    let readme: string;
    try {
      readme = execSync(`git show ${hash}:README.md`, {
        cwd: CLONE_DIR,
        encoding: "utf8",
      });
    } catch {
      console.warn(`  Skipping ${hash} (${date}): README not found`);
      failed++;
      continue;
    }

    // 5. Extract counts
    const matches = [...readme.matchAll(COUNT_REGEX)];
    if (matches.length !== 4) {
      skipped++;
      continue; // README format didn't have counts yet, or unexpected extra matches
    }

    const [usaIntern, usaNewGrad, intlIntern, intlNewGrad] = matches.map(
      (m) => parseInt(m[1], 10)
    );

    // 6. Upsert — empty update to not overwrite existing cron data
    try {
      await prisma.dashboardSnapshot.upsert({
        where: { date: new Date(date) },
        create: {
          date: new Date(date),
          usa_internships: usaIntern,
          usa_new_grad: usaNewGrad,
          intl_internships: intlIntern,
          intl_new_grad: intlNewGrad,
        },
        update: {}, // don't overwrite if cron already recorded this date
      });
      upserted++;
    } catch (err) {
      console.error(`  Error on ${date}:`, err);
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${entries.length}`);
    }
  }

  console.log(`\nDone! Upserted: ${upserted}, Skipped: ${skipped}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
