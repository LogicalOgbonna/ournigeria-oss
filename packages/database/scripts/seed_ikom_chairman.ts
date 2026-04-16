import { PrismaService } from '../src/prisma.service';

const prisma = new PrismaService({});

const leaders = [
  { name: 'Hon. Pst. (Mrs) Mercy Nsor', role: 'lga_chairman' },
  { name: 'Hon. Ndome, Maurice', role: 'vice_chairman' },
];

function generateFakePhone() {
  const digits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+23480${digits}`;
}

async function main() {
  await prisma.onModuleInit();
  
  const lgaCode = 'cross_river_ikom';

  for (const c of leaders) {
    // 1. Create the placeholder official
    const official = await prisma.nigerianOfficial.create({
      data: {
        name: `Unknown ${c.role === 'lga_chairman' ? 'Chairman' : 'Vice Chairman'} (Ikom LGA)`,
        completenessScore: 0.1,
      }
    });

    // 2. Create the official position
    const position = await prisma.officialPosition.create({
      data: {
        officialId: official.id,
        role: c.role,
        appointmentType: 'elected',
        status: 'active',
        lgaCode: lgaCode,
        startDate: new Date('2023-05-29'), // placeholder date
        sourceType: 'manual',
        confidence: 'low',
        reviewStatus: 'unreviewed'
      }
    });

    // 3. Create the highly upvoted proposal
    const upvotes = Math.floor(Math.random() * 100) + 50; // 50 to 150 upvotes
    const downvotes = Math.floor(Math.random() * 5); // 0 to 4 downvotes
    
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

    console.log(`Seeded proposal for Ikom ${c.role}: ${c.name} (${upvotes} upvotes)`);
  }
  
  await prisma.onModuleDestroy();
}

main().catch(console.error);
