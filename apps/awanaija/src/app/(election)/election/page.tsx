import { redirect } from "next/navigation";

// Superseded by the /election/[state] route (the proxy always rewrites to a
// state-specific slug now). A bare /election with no state just goes home.
export default function ElectionIndex() {
  redirect("/");
}
