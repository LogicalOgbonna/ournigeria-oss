import { redirect } from "next/navigation";

// Flagged is now a filter tab on the Conversations page.
export default function FlaggedConversationsPage() {
  redirect("/dashboard/conversations?filter=flagged");
}
