import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" 
    ? ["query", "info", "error", "warn"] 
    : ["error"],
});


async function main() {
  // change to reference a table in your schema
  const val = await prisma.users_metadata.findMany({
    take: 10,
  });
  console.log(val);
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