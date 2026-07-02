"use client";

import dynamic from "next/dynamic";
import { Box, Loader2, Map } from "lucide-react";
import { useMemo, useState } from "react";
import type { Property } from "@/types/property";

const Location3DMap = dynamic(
  () => import("@/components/Location3DMap").then((mod) => mod.Location3DMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[560px] items-center justify-center rounded-[28px] border border-white/10 bg-black/70">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#d9b56f]" />
          <p className="mt-4 text-sm font-semibold text-white/70">
            Preparando mapa de localizacao...
          </p>
        </div>
      </div>
    ),
  },
);

type Location3DSectionProps = {
  property: Property;
};

export type LocationViewMode = "2d" | "3d";

function hasCoordinates(property: Property) {
  return Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}

export function Location3DSection({ property }: Location3DSectionProps) {
  const [mode, setMode] = useState<LocationViewMode>("3d");
  const available = useMemo(() => hasCoordinates(property), [property]);

  if (!available) {
    return null;
  }

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b56f]">
            <Box className="h-4 w-4" />
            Vista 3D
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Explore a localizacao em 3D
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
            Veja o entorno do empreendimento e entenda o posicionamento antes de visitar.
          </p>
        </div>

        <div className="flex w-fit rounded-2xl border border-white/10 bg-white/[0.07] p-1 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "2d"
                ? "bg-[#d9b56f] text-black"
                : "text-white/62 hover:text-white"
            }`}
            onClick={() => setMode("2d")}
            type="button"
          >
            <Map className="h-4 w-4" />
            Mapa 2D
          </button>
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "3d"
                ? "bg-[#d9b56f] text-black"
                : "text-white/62 hover:text-white"
            }`}
            onClick={() => setMode("3d")}
            type="button"
          >
            <Box className="h-4 w-4" />
            Vista 3D
          </button>
        </div>
      </div>

      <Location3DMap mode={mode} property={property} />
    </section>
  );
}
