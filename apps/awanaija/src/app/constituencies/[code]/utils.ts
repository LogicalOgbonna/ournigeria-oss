import { getConstituencyDetails, type ConstituencyDetails } from "@/lib/api";

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

export function typeLabel(type: string): string {
  switch (type) {
    case "federal":
      return "Federal Constituency";
    case "state":
      return "State Constituency";
    case "senatorial":
      return "Senatorial District";
    default:
      return "Constituency";
  }
}

export { ROLE_LABELS, roleLabel } from "@/lib/roles";

export async function fetchConstituency(
  code: string,
): Promise<ConstituencyDetails | null> {
  try {
    return await getConstituencyDetails(code);
  } catch {
    return null;
  }
}
