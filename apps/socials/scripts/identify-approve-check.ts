#!/usr/bin/env npx tsx
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ReplyQueueService } from "../src/reply-queue/reply-queue.service.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
}) as any;
// publisher stub that throws — getPending must never touch it
const svc = new ReplyQueueService(
  prisma,
  {
    publishOriginal: () => {
      throw new Error("no publish in test");
    },
  } as any,
  { findByHandle: async () => null, taggedInLastDay: async () => 0, markTagged: async () => {} } as any,
  { get: () => 10 } as any,
);

async function main() {
  const post = await prisma.socialPost.create({
    data: {
      platform: "twitter",
      postType: "identify_seat",
      content: "ITEST parked identify draft",
      status: "drafted",
      reviewStatus: "pending",
      dataDomain: "officials",
    },
  });
  const page = await svc.getPending();
  const items = page.items ?? page.data ?? page; // tolerate the real shape
  const found = Array.isArray(items) && items.some((p: any) => p.id === post.id);
  await prisma.socialPost.delete({ where: { id: post.id } });
  if (!found) {
    console.error("FAIL: identify_seat draft not surfaced by getPending");
    process.exit(1);
  }
  console.log("approve/getPending checks ✅");
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
