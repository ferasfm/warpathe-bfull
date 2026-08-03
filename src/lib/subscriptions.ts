import type { FuelType } from "./fuel-types";

const KEY = "huda_fuel_subs_v1";

// Map<stationId, FuelType[]>
export type SubsMap = Record<string, FuelType[]>;

export function loadSubs(): SubsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SubsMap) : {};
  } catch {
    return {};
  }
}

export function saveSubs(subs: SubsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(subs));
  window.dispatchEvent(new CustomEvent("huda-subs-changed"));
}

export function setStationSubs(stationId: string, fuels: FuelType[]) {
  const subs = loadSubs();
  if (fuels.length === 0) delete subs[stationId];
  else subs[stationId] = fuels;
  saveSubs(subs);
}

export function getStationSubs(stationId: string): FuelType[] {
  return loadSubs()[stationId] ?? [];
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const r = await Notification.requestPermission();
  return r === "granted";
}

export function fireNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico", tag: title });
  } catch {
    // ignore
  }
}
