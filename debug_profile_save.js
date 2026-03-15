async function test() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({ where: { email: { not: null } } });
    console.log("Found user:", user?.email, user?.id);
    
    if (!user) return console.log("No user found");

    const data = {
      firstName: "Khanh",
      lastName: "Le",
      phone: "8133007513",
      linkedinUrl: "linkedin.com/kaydeletk",
      country: "United States",
      usWorkAuth: true,
      requiresSponsorship: false,
      veteranStatus: "I am not a veteran",
      disabilityStatus: "No, I do not have a disability",
      gender: "Prefer not to answer",
      race: "Prefer not to answer",
      masterResume: "",
      masterResumeName: ""
    };

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data }
    });
    
    console.log("Success! Profile:", profile.id);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
