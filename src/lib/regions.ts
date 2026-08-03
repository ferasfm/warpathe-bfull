export const WEST_BANK_REGIONS = [
  "القدس",
  "رام الله والبيرة",
  "بيت لحم",
  "الخليل",
  "نابلس",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "سلفيت",
  "طوباس",
  "أريحا والأغوار",
] as const;

export type Region = (typeof WEST_BANK_REGIONS)[number];
