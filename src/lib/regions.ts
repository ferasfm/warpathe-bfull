export const WEST_BANK_GOVERNORATES = [
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

export type Governorate = (typeof WEST_BANK_GOVERNORATES)[number];

export const REGIONS = [
  { id: "north", label: "منطقة الشمال" },
  { id: "central", label: "منطقة الوسط" },
  { id: "south", label: "منطقة الجنوب" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export const GOVERNORATE_TO_REGION: Record<Governorate, RegionId> = {
  "نابلس": "north",
  "جنين": "north",
  "طولكرم": "north",
  "قلقيلية": "north",
  "سلفيت": "north",
  "طوباس": "north",
  "القدس": "central",
  "رام الله والبيرة": "central",
  "أريحا والأغوار": "central",
  "بيت لحم": "south",
  "الخليل": "south",
};

