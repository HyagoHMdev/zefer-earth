export type PropertyType =
  | "Apartamento"
  | "Frente mar"
  | "Cobertura"
  | "Home club"
  | "Studio"
  | (string & {});

export type PropertySource = "mock" | "admin-api";

export type AdminProjectRow = Record<string, unknown>;

export type Property3DModelType = "glb" | "gltf" | "iframe" | "imagem_360" | (string & {});

export type Property = {
  id: string;
  slug?: string;
  name: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  initialPrice: number;
  downPayment: number;
  deliveryYear: number;
  type: PropertyType;
  beachDistance: string;
  developer: string;
  imageUrl: string;
  pdfUrl: string;
  whatsappUrl: string;
  active?: boolean;
  tags?: string[];
  headline?: string;
  description?: string;
  galleryUrls?: string[];
  has3dModel?: boolean;
  model3dUrl?: string;
  model3dType?: Property3DModelType;
  image360Url?: string;
  tourVirtualUrl?: string;
  threeDDescription?: string;
  detailsUrl?: string;
  source?: PropertySource;
  createdAt?: string;
  updatedAt?: string;
  raw?: AdminProjectRow;
};
