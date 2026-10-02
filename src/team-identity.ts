import type { Teammate, TeamMember } from "./api";

const characters = new Set(["riya", "tara", "milo", "milan", "chotu", "vijay", "baba", "ma"]);

export function memberCharacter(member: TeamMember): string {
  if (member.character && characters.has(member.character)) return member.character;
  return characters.has(member.id) ? member.id : "tara";
}

export function teamName(team: Teammate): string {
  if (team.teamIdentity?.name) return team.teamIdentity.name;
  const skills = team.plan.skills;
  if (skills.includes("website_publish")) return "Udaan · Website Team";
  if (skills.includes("whatsapp_enquiries") && skills.includes("paytm_request")) return "Saathi · Sales & Payments";
  if (skills.some((s) => s.startsWith("instagram_"))) return "Rang · Instagram Team";
  if (skills.includes("gmail_sales")) return "Milo · Sales Team";
  if (skills.includes("whatsapp_schedule")) return "Milan · Personal Assistant";
  return team.plan.name;
}

export function websiteStageName(stage: string, specialistName?: string): string {
  const label = ({
    asset_curator: "Aditi · Assets reviewed",
    designer: "Dev · Design prepared",
    copywriter: "Kavya · Copy prepared",
    writer: "Kavya · Copy prepared",
    trusted_qa: "Nisha · Factual checks",
    verified: "Nisha · Factual checks",
  } as Record<string, string>)[stage] || stage.replaceAll("_", " ");
  return specialistName ? `${specialistName} · ${label.includes(" · ") ? label.split(" · ")[1] : label}` : label;
}
