"use client";

import dynamic from "next/dynamic";
import { ExternalLink, Image as ImageIcon, ScanSearch } from "lucide-react";
import type { Property } from "@/types/property";

const ModelViewer3D = dynamic(
  () => import("@/components/ModelViewer3D").then((mod) => mod.ModelViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-black/70">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border border-[#d9b56f]/20 border-t-[#d9b56f]" />
          <p className="text-sm font-semibold text-white/75">Preparando viewer 3D...</p>
        </div>
      </div>
    ),
  },
);

type Experience3DSectionProps = {
  property: Property;
};

function has3DContent(property: Property) {
  return Boolean(
    property.model3dUrl ||
      property.image360Url ||
      property.tourVirtualUrl ||
      property.threeDDescription,
  );
}

function isModelFile(property: Property) {
  const type = property.model3dType?.toLowerCase();
  return Boolean(property.model3dUrl && (type === "glb" || type === "gltf"));
}

function isIframe(property: Property) {
  return Boolean(property.model3dUrl && property.model3dType?.toLowerCase() === "iframe");
}

export function Experience3DSection({ property }: Experience3DSectionProps) {
  if (!has3DContent(property)) {
    return null;
  }

  const description =
    property.threeDDescription ||
    "Veja o projeto com mais profundidade antes de visitar.";

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b56f]">
            <ScanSearch className="h-4 w-4" />
            Experiencia 3D
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Explore o empreendimento em 3D
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-white/62">{description}</p>
      </div>

      {isModelFile(property) && property.model3dUrl && (
        <ModelViewer3D modelUrl={property.model3dUrl} />
      )}

      {!isModelFile(property) && isIframe(property) && property.model3dUrl && (
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking"
            allowFullScreen
            className="aspect-video w-full"
            loading="lazy"
            src={property.model3dUrl}
            title={`Experiencia 3D - ${property.name}`}
          />
        </div>
      )}

      {!isModelFile(property) &&
        !isIframe(property) &&
        property.image360Url && (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70">
              <ImageIcon className="h-4 w-4 text-[#d9b56f]" />
              Arraste horizontalmente para explorar a imagem 360
            </div>
            <div className="overflow-x-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`Imagem 360 de ${property.name}`}
                className="h-[420px] min-w-[1100px] object-cover"
                src={property.image360Url}
              />
            </div>
          </div>
        )}

      {!isModelFile(property) &&
        !isIframe(property) &&
        !property.image360Url &&
        property.tourVirtualUrl && (
          <a
            className="inline-flex items-center gap-2 rounded-2xl bg-[#d9b56f] px-5 py-3 font-semibold text-black transition hover:bg-[#f1cf86]"
            href={property.tourVirtualUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir tour virtual
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
    </section>
  );
}
