export interface BudgetOfficial {
  role: string;
  name: string;
  title?: string;
  party?: string;
  imageUrl?: string;
}

export interface BudgetOfficials {
  state: string;
  year: number;
  officials: BudgetOfficial[];
}
