import { PrismaClient } from "@prisma/client";

declare global {
  var prisma_v2: PrismaClient | undefined;
}

export const prisma =
  global.prisma_v2 ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma_v2 = prisma;
}
