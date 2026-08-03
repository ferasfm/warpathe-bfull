export type FuelType = "gasoline_95" | "gasoline_98" | "diesel" | "kerosene" | "gas";

export const FUEL_LABELS: Record<FuelType, string> = {
  gasoline_95: "بنزين 95",
  gasoline_98: "بنزين 98",
  diesel: "سولار",
  kerosene: "كاز",
  gas: "غاز",
};

export const FUEL_ORDER: FuelType[] = ["gasoline_95", "gasoline_98", "diesel", "kerosene", "gas"];

export const FUEL_ICONS: Record<FuelType, string> = {
  gasoline_95: "⛽",
  gasoline_98: "⛽",
  diesel: "🚛",
  kerosene: "🛢️",
  gas: "🔥",
};
