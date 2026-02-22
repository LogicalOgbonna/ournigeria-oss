import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user";

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      // No user yet — return empty list (not an error)
      return Response.json([]);
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { sequenceNumber: "desc" },
          take: 1,
          select: {
            content: true,
            role: true,
          },
        },
        _count: {
          select: {
            messages: { where: { role: "user" } },
          },
        },
      },
    });

    const result = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageRole: c.messages[0]?.role ?? null,
      messageCount: c._count.messages,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("Conversations list error:", err);
    return Response.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}
