import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/ournigeria"
    }
  }
});
async function main() {
  const state = await prisma.nigerianState.findFirst({where: {name: {startsWith: 'Rivers'}}});
  console.log("State:", state?.name);
  if (state) {
    const lga = await prisma.nigerianLga.findFirst({where: {stateCode: state.code, name: {startsWith: 'Obio'}}});
    console.log("LGA:", lga?.name);
    if (lga) {
      const ward = await prisma.nigerianWard.findFirst({where: {lgaCode: lga.code}});
      console.log("Ward:", ward?.name);
    }
  }
}
main();
