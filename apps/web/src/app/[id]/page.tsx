import { Suspense } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import ChatLoading from "./loading";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContainer conversationId={id} />
    </Suspense>
  );
}
