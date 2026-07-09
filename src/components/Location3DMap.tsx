"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { Property, TerrainGeometry } from "@/types/property";

type Mapbox = typeof import("mapbox-gl").default;
import type { LocationViewMode } from "@/components/Location3DSection";

type Location3DMapProps = {
  property: Property;
  mode: LocationViewMode;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return value > 0 ? currency.format(value) : "Consultar";
}

function cameraFor(property: Property, mode: LocationViewMode) {
  return {
    center: [property.longitude, property.latitude] as [number, number],
    zoom: mode === "3d" ? 15.8 : 14.4,
    pitch: mode === "3d" ? 62 : 0,
    bearing: mode === "3d" ? -28 : 0,
  };
}

// Todas as posições [lng,lat] do terreno (Polygon ou MultiPolygon).
function terrainPositions(geom: TerrainGeometry): number[][] {
  return geom.type === "Polygon" ? geom.coordinates.flat() : geom.coordinates.flat(2);
}

// Área a desenhar: o terreno real quando existir; senão, o quadrado provisório.
function projectFeature(property: Property) {
  if (property.terrain) {
    return { type: "Feature" as const, properties: {}, geometry: property.terrain };
  }

  const point = [property.longitude, property.latitude];
  const delta = 0.00032;
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [[
        [point[0] - delta, point[1] - delta],
        [point[0] + delta, point[1] - delta],
        [point[0] + delta, point[1] + delta],
        [point[0] - delta, point[1] + delta],
        [point[0] - delta, point[1] - delta],
      ]],
    },
  };
}

// Enquadramento da câmera considerando o terreno inteiro (quando houver).
function frameCamera(
  map: MapboxMap,
  mapbox: Mapbox,
  property: Property,
  mode: LocationViewMode,
  animate: boolean,
) {
  const base = cameraFor(property, mode);
  let camera: ReturnType<MapboxMap["cameraForBounds"]> | null = null;

  if (property.terrain) {
    const positions = terrainPositions(property.terrain);
    const bounds = new mapbox.LngLatBounds();
    for (const pos of positions) {
      if (Number.isFinite(pos[0]) && Number.isFinite(pos[1])) {
        bounds.extend([pos[0], pos[1]]);
      }
    }
    if (!bounds.isEmpty()) {
      // Em telas largas o card "Empreendimento destacado" cobre a esquerda do
      // mapa — dá folga extra desse lado para o terreno não ficar escondido.
      const wide = map.getContainer().offsetWidth >= 768;
      const gap = mode === "3d" ? 140 : 80;
      const padding = wide
        ? { top: gap, right: gap, bottom: gap, left: 380 }
        : { top: gap, right: gap, bottom: gap, left: gap };
      camera = map.cameraForBounds(bounds, { padding, maxZoom: 17.4 });
    }
  }

  const target = {
    center: (camera?.center ?? base.center) as [number, number],
    zoom:
      typeof camera?.zoom === "number"
        ? camera.zoom - (mode === "3d" ? 0.5 : 0.15)
        : base.zoom,
    pitch: base.pitch,
    bearing: base.bearing,
  };

  if (animate) {
    map.easeTo({
      ...target,
      duration: 1100,
      easing: (time) => time * (2 - time),
      essential: true,
    });
  } else {
    map.jumpTo(target);
  }
}

function addProjectArea(map: MapboxMap, property: Property) {
  const sourceId = "zefer-project-area";
  const layerFillId = "zefer-project-area-fill";
  const layerLineId = "zefer-project-area-line";
  const geometry = projectFeature(property);

  if (map.getSource(sourceId)) {
    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    source.setData(geometry);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data: geometry,
  });

  // Preenchimento dourado transparente.
  map.addLayer({
    id: layerFillId,
    type: "fill",
    source: sourceId,
    slot: "middle",
    paint: {
      "fill-color": "#d9b56f",
      "fill-opacity": 0.3,
    },
  });

  // Borda dourada (mais forte para leitura no 3D em pitch alto).
  map.addLayer({
    id: layerLineId,
    type: "line",
    source: sourceId,
    slot: "middle",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#f3d797",
      "line-width": 2.4,
      "line-opacity": 0.9,
    },
  });
}

// O estilo Mapbox Standard já traz prédios 3D com textura, árvores e água em
// cores reais, com iluminação de dia — então não extrudamos prédios cinza nem
// aplicamos névoa manual. Só mantemos o relevo real (DEM).
function addTerrain(map: MapboxMap) {
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({ source: "mapbox-dem", exaggeration: 1.1 });
}

export function Location3DMap({ property, mode }: Location3DMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      if (!mapContainerRef.current || mapRef.current) return;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setError("Configure o token Mapbox para liberar a vista 3D.");
        return;
      }

      try {
        const mapbox = (await import("mapbox-gl")).default;
        if (cancelled || !mapContainerRef.current) return;

        mapbox.accessToken = token;
        const map = new mapbox.Map({
          container: mapContainerRef.current,
          ...cameraFor(property, mode),
          style: "mapbox://styles/mapbox/standard",
          antialias: true,
          minZoom: 12,
          maxZoom: 18.5,
        });

        map.addControl(
          new mapbox.NavigationControl({ visualizePitch: true }),
          "bottom-right",
        );

        mapboxRef.current = mapbox;
        mapRef.current = map;

        // Mantém o canvas do mapa acompanhando o tamanho do container (evita
        // o mapa renderizar numa faixa pequena e o resto ficar preto).
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(mapContainerRef.current);

        map.on("load", () => {
          try {
            map.setConfigProperty("basemap", "lightPreset", "day");
          } catch {
            // estilo sem config de basemap — segue o default
          }
          addTerrain(map);
          addProjectArea(map, property);
          frameCamera(map, mapbox, property, mode, false);
          map.resize();
          setMapReady(true);
        });

        map.on("error", () => {
          setError("Nao foi possivel carregar a vista 3D agora.");
        });
      } catch {
        if (!cancelled) {
          setError("Nao foi possivel carregar a vista 3D agora.");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, [property, mode]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !mapReady) return;

    markerRef.current?.remove();
    const markerElement = document.createElement("div");
    markerElement.className = "zefer-location-3d-marker";
    markerElement.setAttribute("aria-label", property.name);

    markerRef.current = new mapbox.Marker({
      element: markerElement,
      anchor: "bottom",
    })
      .setLngLat([property.longitude, property.latitude])
      .addTo(map);
  }, [mapReady, property]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !mapReady) return;

    // Reaplica a área (o terreno pode ter mudado ao trocar de empreendimento).
    addProjectArea(map, property);
    frameCamera(map, mapbox, property, mode, true);

    if (mode === "3d") {
      addTerrain(map);
    } else {
      map.setTerrain(null);
    }
  }, [mapReady, mode, property]);

  function resetCamera() {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox) return;
    frameCamera(map, mapbox, property, mode, true);
  }

  return (
    <div className="relative h-[62vh] min-h-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_40%,rgba(217,181,111,0.08),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.62))]" />

      <div className="absolute left-4 top-4 z-10 max-w-[310px] rounded-3xl border border-white/10 bg-black/55 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
          Empreendimento destacado
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">{property.name}</h3>
        <p className="mt-1 text-sm text-white/58">
          {property.city} / {property.neighborhood}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <p className="text-white/42">Valor inicial</p>
            <p className="mt-1 font-semibold text-white">
              {formatCurrency(property.initialPrice)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <p className="text-white/42">Entrada</p>
            <p className="mt-1 font-semibold text-white">
              {formatCurrency(property.downPayment)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <p className="text-white/42">Entrega</p>
            <p className="mt-1 font-semibold text-white">
              {property.deliveryYear || "Consultar"}
            </p>
          </div>
          <Link
            className="flex items-center justify-center rounded-2xl bg-[#d9b56f] p-3 text-center text-xs font-bold text-black transition hover:bg-[#f1cf86]"
            href={property.detailsUrl ?? `/projetos/${property.slug ?? property.id}`}
          >
            Ver detalhes
          </Link>
        </div>
      </div>

      <button
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm font-semibold text-white/80 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:border-[#d9b56f] hover:text-[#d9b56f]"
        onClick={resetCamera}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        Resetar camera
      </button>

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xl">
          <div className="max-w-sm rounded-3xl border border-white/10 bg-white/[0.08] p-6">
            <TriangleAlert className="mx-auto h-8 w-8 text-[#d9b56f]" />
            <p className="mt-4 text-sm font-semibold text-white">{error}</p>
            <p className="mt-2 text-xs leading-6 text-white/55">
              A pagina continua funcionando; tente recarregar ou confira o token Mapbox.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
