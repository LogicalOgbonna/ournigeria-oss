import { PrismaService } from '../src/prisma.service';

const prisma = new PrismaService({});

const councilors = [
  { name: 'Hon. Enya Ndifon Enya', wardCode: 'cross_river_ikom_ofutop_i', leadershipRole: null },
  { name: 'Hon Chris Ngari', wardCode: 'cross_river_ikom_abanyum', leadershipRole: null },
  { name: 'Hon. Ndifon Linda Nenjom', wardCode: 'cross_river_ikom_olulumo', leadershipRole: null },
  { name: 'Hon. Randy Egon Assi', wardCode: 'cross_river_ikom_nta_nselle', leadershipRole: null },
  { name: 'Hon. Njang Ndoma Njang', wardCode: 'cross_river_ikom_ikom_urban_i', leadershipRole: null },
  { name: 'Hon. Egiga Agim Obaji', wardCode: 'cross_river_ikom_akparabong', leadershipRole: null },
  { name: 'Hon. Lifu Adoga', wardCode: 'cross_river_ikom_yala_nkum', leadershipRole: null },
  // The 4 leaders assigned to the remaining 4 wards
  { name: 'Hon Cletus Efale Moyo', wardCode: 'cross_river_ikom_ikom_urban_ii', leadershipRole: 'Leader Of Council' },
  { name: 'Hon Kasetima Ayiba Nentui', wardCode: 'cross_river_ikom_nde', leadershipRole: 'Deputy Leader' },
  { name: 'Hon. Osim Markpeace Enya', wardCode: 'cross_river_ikom_nnam', leadershipRole: 'Majority Leader' },
  { name: 'Hon. Neku Mkpak Enyeme', wardCode: 'cross_river_ikom_ofutop_ii', leadershipRole: 'Chief Whip' },
];

function generateFakePhone() {
  const digits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+23480${digits}`;
}

async function main() {
  await prisma.onModuleInit();

  for (const c of councilors) {
    const ward = await prisma.nigerianWard.findUnique({ where: { code: c.wardCode } });
    if (!ward) continue;

    // 1. Create the placeholder official
    const official = await prisma.nigerianOfficial.create({
      data: {
        name: `Unknown Councillor (${ward.name})`,
        completenessScore: 0.1,
      }
    });

    // 2. Create the official position
    const position = await prisma.officialPosition.create({
      data: {
        officialId: official.id,
        role: 'councilor',
        leadershipRole: c.leadershipRole,
        appointmentType: 'elected',
        status: 'active',
        wardCode: c.wardCode,
        startDate: new Date('2023-05-29'), // placeholder date
        sourceType: 'manual',
        confidence: 'low',
        reviewStatus: 'unreviewed'
      }
    });

    // 3. Create the highly upvoted proposal
    const upvotes = Math.floor(Math.random() * 60) + 20; // 20 to 80 upvotes
    const downvotes = Math.floor(Math.random() * 3); // 0 to 2 downvotes
    
    const proposal = await prisma.dataProposal.create({
      data: {
        officialId: official.id,
        positionId: position.id,
        proposerPhone: generateFakePhone(),
        targetField: 'name',
        proposedValue: { value: c.name },
        status: 'submitted',
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        voteScore: upvotes - downvotes,
      }
    });

    // 4. Generate some fake votes to back up the count
    const votesData = [];
    for (let i = 0; i < upvotes; i++) {
      votesData.push({
        proposalId: proposal.id,
        voterPhone: generateFakePhone(),
        direction: 1
      });
    }
    for (let i = 0; i < downvotes; i++) {
      votesData.push({
        proposalId: proposal.id,
        voterPhone: generateFakePhone(),
        direction: -1
      });
    }

    await prisma.proposalVote.createMany({
      data: votesData,
      skipDuplicates: true
    });

    console.log(`Seeded proposal for ${ward.name}: ${c.name} (${upvotes} upvotes)`);
  }
  
  await prisma.onModuleDestroy();
}

main().catch(console.error);
