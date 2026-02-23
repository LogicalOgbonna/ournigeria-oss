import { Suspense } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function Home() {
  return (
    <Suspense>
      <ChatContainer />
    </Suspense>
  );
}
