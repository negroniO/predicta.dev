// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Optional: clear existing data while developing
  await prisma.project.deleteMany();

  await prisma.project.createMany({
    data: [
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
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
