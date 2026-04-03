import { prisma } from "@/lib/prisma";

interface CategoryCount {
  total: number;
  faang: number;
  quant: number;
  other: number;
}

interface DashboardStats {
  categories: {
    usaInternships: CategoryCount;
    usaNewGrad: CategoryCount;
    intlInternships: CategoryCount;
    intlNewGrad: CategoryCount;
  };
  totalJobs: number;
  recentPostings: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    postedAt: string;
    category: string;
    url: string | null;
  }>;
  topHiring: Array<{ company: string; count: number }>;
  marketTrend: Array<{
    date: string;
    usaInternships: number;
    usaNewGrad: number;
    intlInternships: number;
    intlNewGrad: number;
  }>;
  lastSynced: string;
}

async function countByCategory(
  jobType: string,
  region: string
): Promise<CategoryCount> {
  const baseWhere = {
    tags: { hasEvery: [jobType, region] },
  };

  const [total, faang, quant] = await Promise.all([
    prisma.job_postings.count({ where: baseWhere }),
    prisma.job_postings.count({
      where: { tags: { hasEvery: [jobType, region, "faang"] } },
    }),
    prisma.job_postings.count({
      where: { tags: { hasEvery: [jobType, region, "quant"] } },
    }),
  ]);

  return { total, faang, quant, other: total - faang - quant };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    usaInternships,
    usaNewGrad,
    intlInternships,
    intlNewGrad,
    recentPostingsRaw,
    topHiringRaw,
    marketTrendRaw,
    lastSyncedRaw,
  ] = await Promise.all([
    countByCategory("internship", "usa"),
    countByCategory("new-grad", "usa"),
    countByCategory("internship", "international"),
    countByCategory("new-grad", "international"),

    // Recent postings — 5 most recent
    prisma.job_postings.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        company: true,
        location: true,
        date_posted: true,
        created_at: true,
        tags: true,
        url: true,
      },
    }),

    // Top hiring — top 5 companies by count
    prisma.job_postings.groupBy({
      by: ["company"],
      _count: { company: true },
      orderBy: { _count: { company: "desc" } },
      take: 5,
    }),

    // Market trend — all snapshots ordered by date
    prisma.dashboardSnapshot.findMany({
      orderBy: { date: "asc" },
      select: {
        date: true,
        usa_internships: true,
        usa_new_grad: true,
        intl_internships: true,
        intl_new_grad: true,
      },
    }),

    // Last synced
    prisma.job_postings.aggregate({
      _max: { created_at: true },
    }),
  ]);

  const totalJobs =
    usaInternships.total +
    usaNewGrad.total +
    intlInternships.total +
    intlNewGrad.total;

  const recentPostings = recentPostingsRaw.map((job) => {
    let category = "uncategorized";
    if (job.tags.includes("usa") && job.tags.includes("internship"))
      category = "usa-intern";
    else if (job.tags.includes("usa") && job.tags.includes("new-grad"))
      category = "usa-newgrad";
    else if (
      job.tags.includes("international") &&
      job.tags.includes("internship")
    )
      category = "intl-intern";
    else if (
      job.tags.includes("international") &&
      job.tags.includes("new-grad")
    )
      category = "intl-newgrad";

    return {
      id: job.id,
      title: job.role,
      company: job.company,
      location: job.location,
      postedAt: (job.date_posted ?? job.created_at).toISOString(),
      category,
      url: job.url,
    };
  });

  const topHiring = topHiringRaw.map((row) => ({
    company: row.company,
    count: row._count.company,
  }));

  const marketTrend = marketTrendRaw.map((snap) => ({
    date: snap.date.toISOString().split("T")[0],
    usaInternships: snap.usa_internships,
    usaNewGrad: snap.usa_new_grad,
    intlInternships: snap.intl_internships,
    intlNewGrad: snap.intl_new_grad,
  }));

  const lastSynced =
    lastSyncedRaw._max.created_at?.toISOString() ?? new Date().toISOString();

  return {
    categories: { usaInternships, usaNewGrad, intlInternships, intlNewGrad },
    totalJobs,
    recentPostings,
    topHiring,
    marketTrend,
    lastSynced,
  };
}
