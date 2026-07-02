"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, Marker, Popup } from "mapbox-gl";
import { Loader2, MapPinned } from "lucide-react";
import type { Property } from "@/types/property";

type MapViewProps = {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
};

const initialCenter: [number, number] = [-48.66, -26.765];
const northCoastBounds: [[number, number], [number, number]] = [
  [-49.05, -27.35],
  [-48.25, -26.45],
];

export function MapView({
  properties,
  selectedProperty,
  onSelectProperty,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupsRef = useRef<Popup[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      if (!token) {
        return;
      }

      const mapbox = (await import("mapbox-gl")).default;

      if (cancelled || !mapContainerRef.current) {
        return;
      }

      mapbox.accessToken = token;

      const map = new mapbox.Map({
        container: mapContainerRef.current,
        center: initialCenter,
        zoom: 10.6,
        minZoom: 9,
        maxZoom: 16.5,
        maxBounds: northCoastBounds,
        pitch: 46,
        bearing: -12,
        style: "mapbox://styles/mapbox/dark-v11",
      });

      map.addControl(
        new mapbox.NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      mapboxRef.current = mapbox;
      mapRef.current = map;
      map.on("load", () => {
        map.resize();
        setMapReady(true);
      });

      resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(mapContainerRef.current);

      requestAnimationFrame(() => {
        map.resize();
      });
    }

    initializeMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      popupsRef.current.forEach((popup) => popup.remove());
      markersRef.current = [];
      popupsRef.current = [];
      mapRef.current?.remove();
      mapboxRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;

    if (!map || !mapbox || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    popupsRef.current.forEach((popup) => popup.remove());
    markersRef.current = [];
    popupsRef.current = [];

    properties.forEach((property) => {
      const selected = selectedProperty?.id === property.id;
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = `zefer-marker ${
        selected ? "zefer-marker-selected" : ""
      }`;
      markerElement.setAttribute("aria-label", `Selecionar ${property.name}`);

      const markerDot = document.createElement("span");
      markerDot.className = "zefer-marker-core";
      markerElement.appendChild(markerDot);

      markerElement.addEventListener("click", () => {
        onSelectProperty(property);
        map.flyTo({
          center: [property.longitude, property.latitude],
          zoom: 13.65,
          duration: 1450,
          curve: 1.45,
          easing: (time) => time * (2 - time),
          essential: true,
        });
      });

      const marker = new mapbox.Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map);

      const popup = new mapbox.Popup({
        className: "zefer-property-popup",
        closeButton: false,
        closeOnClick: false,
        offset: selected ? 58 : 46,
      })
        .setLngLat([property.longitude, property.latitude])
        .setHTML(`<span>${property.name}</span>`);

      if (selected) {
        popup.addTo(map);
      }

      markersRef.current.push(marker);
      popupsRef.current.push(popup);
    });
  }, [mapReady, onSelectProperty, properties, selectedProperty?.id]);

  useEffect(() => {
    if (!selectedProperty || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedProperty.longitude, selectedProperty.latitude],
      zoom: 13.65,
      duration: 1450,
      curve: 1.45,
      easing: (time) => time * (2 - time),
      essential: true,
    });
  }, [selectedProperty]);

  return (
    <section className="relative h-[62vh] min-h-[520px] flex-1 overflow-hidden bg-[#070707] lg:h-auto lg:min-h-0">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {process.env.NEXT_PUBLIC_MAPBOX_TOKEN && !mapReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-8 text-center backdrop-blur-xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9b56f]/30 bg-[#d9b56f]/10">
              <Loader2 className="h-6 w-6 animate-spin text-[#d9b56f]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">
              Carregando mapa premium
            </p>
            <p className="mt-1 text-xs text-white/55">
              Preparando camada geoespacial do litoral norte.
            </p>
          </div>
        </div>
      )}

      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-8 text-center">
          <div className="max-w-sm rounded-lg border border-[#d9b56f]/40 bg-[#0b0b0b] p-5 text-white">
            <p className="text-sm font-semibold text-[#d9b56f]">
              Token Mapbox ausente
            </p>
            <p className="mt-2 text-sm text-white/70">
              Configure NEXT_PUBLIC_MAPBOX_TOKEN em .env.local.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black/70 to-transparent" />
      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white shadow-[0_16px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
          <MapPinned className="h-4 w-4" />
          Mapbox Live
        </p>
      </div>

    </section>
  );
}
