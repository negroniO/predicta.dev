const { PrismaClient } = require("@prisma/client");

function assertLocalSeedAllowed(env) {
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error("A local DATABASE_URL is required"); }
  if (env.NODE_ENV !== "development" || env.ALLOW_DEV_SEED !== "1" ||
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.searchParams.has("host")) {
    throw new Error("Seeding requires NODE_ENV=development, ALLOW_DEV_SEED=1 and a loopback database URL");
  }
}

const examples = [
      {
        slug: "failed-credit-card-dashboard",
        title: "Failed Credit Card Collections Dashboard",
        subtitle: "Recovering £60k of failed payments",
        description:
          "End-to-end analytics for failed card payments: Tableau dashboards, forecasting with Prophet, and recovery tracking for 1,600+ orders.",
        year: 2024,
        status: "Completed",
        featured: true,
        tags: ["Collections", "Payments", "Analytics"],
        techStack: ["Tableau", "Python", "Prophet", "Excel"],
        githubUrl: null,
        liveUrl: null,
        sortOrder: 1,
      },
      {
        slug: "predicta-finance-analytics",
        title: "Predicta Finance Analytics",
        subtitle: "FP&A and collections insights",
        description:
          "Financial analytics toolkit for DSO, cash collection, and scenario analysis using Python, SQL, and interactive dashboards.",
        year: 2025,
        status: "In Progress",
        featured: true,
        tags: ["FP&A", "Collections", "Forecasting"],
        techStack: ["Python", "SQL", "Power BI", "Tableau"],
        githubUrl: "https://github.com/negroniO/predicta.dev",
        liveUrl: null,
        sortOrder: 2,
      },
    ];

async function seed(prisma) {
  for (const data of examples) {
    // Existing rows and their related analytics are never overwritten or removed.
    await prisma.project.upsert({ where: { slug: data.slug }, create: data, update: {} });
  }
}

module.exports = { assertLocalSeedAllowed, seed };

if (require.main === module) {
  assertLocalSeedAllowed(process.env);
  const prisma = new PrismaClient();
  seed(prisma)
    .catch(() => { console.error("Local seed failed"); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
