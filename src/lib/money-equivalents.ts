import { MoneyEquivalent } from "@/types";
import { UNIT_COSTS } from "./constants";

export function calculateEquivalents(amount: number): MoneyEquivalent[] {
  return [
    {
      icon: "Home",
      label: "Homes built",
      count: Math.floor(amount / UNIT_COSTS.house),
      unitCost: UNIT_COSTS.house,
      unitLabel: "\u20A625M each",
    },
    {
      icon: "GraduationCap",
      label: "Schools built",
      count: Math.floor(amount / UNIT_COSTS.school),
      unitCost: UNIT_COSTS.school,
      unitLabel: "\u20A620M each",
    },
    {
      icon: "Droplets",
      label: "Boreholes drilled",
      count: Math.floor(amount / UNIT_COSTS.borehole),
      unitCost: UNIT_COSTS.borehole,
      unitLabel: "\u20A65M each",
    },
    {
      icon: "Lightbulb",
      label: "Homes powered for a year",
      count: Math.floor(amount / UNIT_COSTS.homePowered),
      unitCost: UNIT_COSTS.homePowered,
      unitLabel: "\u20A6100K/yr",
    },
  ];
}
