import { properties as fallbackProperties } from "@/data/properties";
import type { AdminProjectRow, Property, PropertyType } from "@/types/property";

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

function getGalleryUrls(row: AdminProjectRow) {
  const gallery = row.galeria;

  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery
    .map((item) => getString(item as AdminProjectRow, ["url"]))
    .filter(Boolean);
}

function getModel3dType(row: AdminProjectRow) {
  return getString(row, ["modelo_3d_tipo", "model3dType", "model_3d_type"])
    .toLowerCase()
    .replace("iframe/embed", "iframe")
    .replace("imagem 360", "imagem_360");
}

function mapAdminProject(row: AdminProjectRow, index: number): Property {
  const latitude = getNumber(row, ["latitude"], NaN);
  const longitude = getNumber(row, ["longitude"], NaN);
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
    has3dModel: getBoolean(row, ["possui_modelo_3d", "has3dModel"], false),
    model3dUrl: getString(row, ["modelo_3d_url", "model3dUrl", "model_3d_url"]),
    model3dType: getModel3dType(row),
    image360Url: getString(row, ["imagem_360_url", "image360Url"]),
    tourVirtualUrl: getString(row, ["tour_virtual", "tourVirtualUrl"]),
    threeDDescription: getString(row, ["descricao_3d", "threeDDescription"]),
    detailsUrl: slug ? `/projetos/${slug}` : undefined,
    source: "admin-api",
    createdAt: getString(row, ["created_at", "createdAt"]),
    updatedAt: getString(row, ["updated_at", "updatedAt"]),
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
