import { properties as fallbackProperties } from "@/data/properties";
import type {
  AdminProjectRow,
  Property,
  PropertyType,
  TerrainGeometry,
} from "@/types/property";

const PREMIUM_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80";

type AdminApiListResponse = {
  data?: AdminProjectRow[];
};

type AdminApiDetailResponse = {
  data?: AdminProjectRow;
};

function getAdminApiUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, "") ?? "";
}

function getHeaders() {
  const headers: HeadersInit = {
    "content-type": "application/json",
  };
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
}

function getString(row: AdminProjectRow, keys: string[], fallback = "") {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  const value = key ? row[key] : undefined;

  return value === undefined || value === null ? fallback : String(value);
}

function getNumber(row: AdminProjectRow, keys: string[], fallback = 0) {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  const value = key ? row[key] : undefined;

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.replace(/[^\d.-]/g, ""));

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  return fallback;
}

function getBoolean(row: AdminProjectRow, keys: string[], fallback = true) {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  const value = key ? row[key] : undefined;

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  return fallback;
}

function getStringArray(row: AdminProjectRow, keys: string[]) {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  const value = key ? row[key] : undefined;

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function getBeachDistance(row: AdminProjectRow) {
  const distance = getNumber(row, ["distancia_praia", "beachDistance"], NaN);

  if (!Number.isFinite(distance)) {
    return "Consultar";
  }

  if (distance === 0) {
    return "Frente mar";
  }

  return distance < 1
    ? `${Math.round(distance * 1000)} m da praia`
    : `${distance.toLocaleString("pt-BR")} km da praia`;
}

function getPdfUrl(row: AdminProjectRow) {
  const directPdf = getString(row, ["pdfUrl", "pdf_url", "apresentacao_url"]);
  const pdf = row.pdf;

  if (directPdf) {
    return directPdf;
  }

  if (Array.isArray(pdf) && pdf[0] && typeof pdf[0] === "object") {
    return getString(pdf[0] as AdminProjectRow, ["url"]);
  }

  return "";
}

// Extrai o terreno real (GeoJSON) do Admin. Só aceita Polygon/MultiPolygon
// com coordinates; qualquer outra coisa vira null (usa área provisória).
function getTerrain(row: AdminProjectRow): TerrainGeometry | null {
  const value = row.terreno_geojson;
  if (!value || typeof value !== "object") {
    return null;
  }

  const geom = value as { type?: unknown; coordinates?: unknown };
  const isPolygon = geom.type === "Polygon" || geom.type === "MultiPolygon";

  if (isPolygon && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
    return geom as TerrainGeometry;
  }

  return null;
}

// Centro (bbox) do terreno — usado como fallback do pino quando o
// empreendimento tem polígono mas não tem lat/lng cadastrada.
function terrainCenter(geom: TerrainGeometry): { lat: number; lng: number } | null {
  const positions =
    geom.type === "Polygon" ? geom.coordinates.flat() : geom.coordinates.flat(2);

  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  let n = 0;

  for (const p of positions) {
    if (Number.isFinite(p[0]) && Number.isFinite(p[1])) {
      minLng = Math.min(minLng, p[0]);
      maxLng = Math.max(maxLng, p[0]);
      minLat = Math.min(minLat, p[1]);
      maxLat = Math.max(maxLat, p[1]);
      n++;
    }
  }

  return n > 0 ? { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 } : null;
}

function getGalleryUrls(row: AdminProjectRow) {
  const gallery = row.galeria;

  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery
    .map((item) => getString(item as AdminProjectRow, ["url"]))
    .filter(Boolean);
}

function mapAdminProject(row: AdminProjectRow, index: number): Property {
  const terrain = getTerrain(row);
  let latitude = getNumber(row, ["latitude"], NaN);
  let longitude = getNumber(row, ["longitude"], NaN);

  // Sem pino, mas com terreno? Usa o centro do polígono para não sumir do mapa.
  if ((!Number.isFinite(latitude) || !Number.isFinite(longitude)) && terrain) {
    const c = terrainCenter(terrain);
    if (c) {
      latitude = c.lat;
      longitude = c.lng;
    }
  }

  const slug = getString(row, ["slug"], "");
  const defaultWhatsapp = process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "";
  const whatsapp = getString(row, ["whatsapp", "whatsapp_url", "whatsappUrl"]);

  return {
    id: getString(row, ["id"], slug || `admin-project-${index}`),
    slug,
    name: getString(row, ["nome", "name"], "Empreendimento"),
    city: getString(row, ["cidade", "city"], "Litoral norte"),
    neighborhood: getString(row, ["bairro", "neighborhood"], "Centro"),
    latitude,
    longitude,
    initialPrice: getNumber(row, ["valor_inicial", "initialPrice"], 0),
    downPayment: getNumber(row, ["entrada", "downPayment"], 0),
    deliveryYear: getNumber(
      row,
      ["ano_entrega", "deliveryYear"],
      new Date().getFullYear(),
    ),
    type: getString(row, ["tipo", "type"], "Apartamento") as PropertyType,
    beachDistance: getBeachDistance(row),
    developer: getString(row, ["construtora", "developer"], "Construtora"),
    imageUrl: getString(
      row,
      ["imagem_principal", "capa_url", "imageUrl"],
      PREMIUM_PLACEHOLDER_IMAGE,
    ),
    pdfUrl: getPdfUrl(row),
    whatsappUrl: whatsapp
      ? `https://wa.me/${whatsapp.replace(/\D/g, "")}`
      : defaultWhatsapp
        ? `https://wa.me/${defaultWhatsapp.replace(/\D/g, "")}`
        : "",
    active: getBoolean(row, ["ativo", "active"], true),
    tags: getStringArray(row, ["tags"]),
    headline: getString(row, ["headline", "subheadline"]),
    description: getString(row, ["texto_comercial", "description"]),
    galleryUrls: getGalleryUrls(row),
    detailsUrl: slug ? `/projetos/${slug}` : undefined,
    source: "admin-api",
    createdAt: getString(row, ["created_at", "createdAt"]),
    updatedAt: getString(row, ["updated_at", "updatedAt"]),
    terrain,
    raw: row,
  };
}

function hasValidCoordinates(property: Property) {
  return Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}

export async function getProperties(): Promise<Property[]> {
  const adminApiUrl = getAdminApiUrl();

  if (!adminApiUrl) {
    return fallbackProperties;
  }

  try {
    const response = await fetch(`${adminApiUrl}/api/projetos`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return fallbackProperties;
    }

    const payload = (await response.json()) as AdminApiListResponse;
    const properties = (payload.data ?? [])
      .map(mapAdminProject)
      .filter((property) => property.active === true)
      .filter(hasValidCoordinates);

    return properties.length > 0 ? properties : fallbackProperties;
  } catch {
    return fallbackProperties;
  }
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const adminApiUrl = getAdminApiUrl();

  if (!adminApiUrl) {
    return fallbackProperties.find((property) => property.slug === slug) ?? null;
  }

  try {
    const response = await fetch(`${adminApiUrl}/api/projetos/${slug}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return fallbackProperties.find((property) => property.slug === slug) ?? null;
    }

    const payload = (await response.json()) as AdminApiDetailResponse;

    if (!payload.data) {
      return null;
    }

    const property = mapAdminProject(payload.data, 0);

    return property.active === true && hasValidCoordinates(property)
      ? property
      : null;
  } catch {
    return fallbackProperties.find((property) => property.slug === slug) ?? null;
  }
}
