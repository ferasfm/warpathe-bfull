import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function authHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey || !mapsKey) throw new Error("Google Maps connector غير مضبوط");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
  } as Record<string, string>;
}

async function ensureAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!isAdmin) throw new Error("غير مصرح");
}

export type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
};

const searchSchema = z.object({
  query: z.string().min(2),
  region: z.string().optional(),
});

export const searchGoogleMapsPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchSchema.parse(d))
  .handler(async ({ data, context }): Promise<PlaceResult[]> => {
    await ensureAdmin(context);
    const textQuery = data.region ? `${data.query} ${data.region} فلسطين` : `${data.query} فلسطين`;
    const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery, languageCode: "ar", regionCode: "PS" }),
    });
    if (!res.ok) throw new Error(`فشل البحث [${res.status}]: ${await res.text()}`);
    const body = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        googleMapsUri?: string;
      }>;
    };
    return (body.places ?? []).map((p) => ({
      place_id: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      latitude: p.location?.latitude ?? null,
      longitude: p.location?.longitude ?? null,
      google_maps_url: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    }));
  });

const urlSchema = z.object({ url: z.string().url() });

// Resolve a Google Maps share URL (including short links) into name+coords
export const resolveGoogleMapsUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => urlSchema.parse(d))
  .handler(async ({ data, context }): Promise<PlaceResult> => {
    await ensureAdmin(context);

    // Follow redirects for short links
    let finalUrl = data.url;
    if (/goo\.gl|maps\.app\.goo\.gl/.test(data.url)) {
      const r = await fetch(data.url, { method: "GET", redirect: "follow" });
      finalUrl = r.url;
    }

    // Try to extract coords from URL patterns
    let lat: number | null = null;
    let lng: number | null = null;
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }
    const bang = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (bang) {
      lat = parseFloat(bang[1]);
      lng = parseFloat(bang[2]);
    }

    // Extract place name from /place/<name>/
    let name = "";
    const placeSeg = finalUrl.match(/\/place\/([^/@]+)/);
    if (placeSeg) {
      try {
        name = decodeURIComponent(placeSeg[1]).replace(/\+/g, " ");
      } catch {
        name = placeSeg[1];
      }
    }

    let address = "";

    // If we have coords, reverse-geocode for better name/address
    if (lat !== null && lng !== null) {
      const res = await fetch(
        `${GATEWAY}/maps/api/geocode/json?latlng=${lat},${lng}&language=ar&region=ps`,
        { headers: authHeaders() },
      );
      if (res.ok) {
        const body = (await res.json()) as { results?: Array<{ formatted_address?: string }> };
        address = body.results?.[0]?.formatted_address ?? "";
      }
    } else if (name) {
      // Fallback: text search
      const res = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
        },
        body: JSON.stringify({ textQuery: name, languageCode: "ar", regionCode: "PS" }),
      });
      if (res.ok) {
        const body = (await res.json()) as {
          places?: Array<{
            id: string;
            displayName?: { text?: string };
            formattedAddress?: string;
            location?: { latitude?: number; longitude?: number };
            googleMapsUri?: string;
          }>;
        };
        const p = body.places?.[0];
        if (p) {
          name = p.displayName?.text ?? name;
          address = p.formattedAddress ?? "";
          lat = p.location?.latitude ?? null;
          lng = p.location?.longitude ?? null;
        }
      }
    }

    if (!name && !address && lat === null) throw new Error("تعذر استخراج معلومات من الرابط");

    return {
      place_id: "",
      name: name || "محطة",
      address,
      latitude: lat,
      longitude: lng,
      google_maps_url: finalUrl,
    };
  });
