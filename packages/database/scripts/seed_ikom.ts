import { PrismaService } from '../src/prisma.service';

async function main() {
  const prisma = new PrismaService({});
  await prisma.onModuleInit();
  
  const state = await prisma.nigerianState.findFirst({ where: { name: { contains: 'Cross River', mode: 'insensitive' } } });
  if (state) {
    const lga = await prisma.nigerianLga.findFirst({ where: { stateCode: state.code, name: { contains: 'Ikom', mode: 'insensitive' } } });
    if (lga) {
      const wards = await prisma.nigerianWard.findMany({ where: { lgaCode: lga.code } });
      console.log('State:', state.code);
      console.log('LGA:', lga.code);
      console.log('Wards:', wards.map(w => ({ name: w.name, code: w.code })));
    }
  }
  
  await prisma.onModuleDestroy();
}

main().catch(console.error);
