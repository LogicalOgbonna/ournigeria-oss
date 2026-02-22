import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UserNotInitializedError } from "@/lib/user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      if (e instanceof UserNotInitializedError) {
        return Response.json({ error: "User not initialized" }, { status: 401 });
      }
      throw e;
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId, status: "active" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { sequenceNumber: "asc" },
          select: {
            id: true,
            sequenceNumber: true,
            role: true,
            content: true,
            richContent: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return Response.json(conversation);
  } catch (err) {
    console.error("Conversation detail error:", err);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      if (e instanceof UserNotInitializedError) {
        return Response.json({ error: "User not initialized" }, { status: 401 });
      }
      throw e;
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Soft delete
    await prisma.conversation.update({
      where: { id },
      data: { status: "deleted" },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Conversation delete error:", err);
    return Response.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
