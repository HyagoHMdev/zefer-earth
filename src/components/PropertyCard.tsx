"use client";

import {
  Building2,
  CalendarDays,
  Gem,
  MapPin,
  Sparkles,
  Waves,
} from "lucide-react";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
  isSelected?: boolean;
  compact?: boolean;
  isBestOpportunity?: boolean;
  isClosestToBeach?: boolean;
  onSelect?: (property: Property) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function PropertyCard({
  property,
  isSelected = false,
  compact = false,
  isBestOpportunity = false,
  isClosestToBeach = false,
  onSelect,
}: PropertyCardProps) {
  const imageHeight = compact ? "h-24" : "h-44";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border backdrop-blur-xl transition duration-500 ease-out ${
        isSelected
          ? "border-[#d9b56f]/80 bg-[#d9b56f]/[0.12] shadow-[0_22px_70px_rgba(217,181,111,0.18)]"
          : "border-white/10 bg-white/[0.07] shadow-[0_18px_60px_rgba(0,0,0,0.24)] hover:-translate-y-0.5 hover:border-[#d9b56f]/60 hover:bg-white/[0.1]"
      }`}
    >
      <button
        className="block w-full text-left"
        type="button"
        onClick={() => onSelect?.(property)}
      >
        <div className={`relative ${imageHeight} overflow-hidden`}>
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${property.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-[#d9b56f]/35 bg-black/45 px-3 py-1 text-xs font-medium text-[#f3d797] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            {property.type}
          </div>
          {(isBestOpportunity || isClosestToBeach) && (
            <div className="absolute right-3 top-3 flex max-w-[72%] flex-col items-end gap-2">
              {isBestOpportunity && (
                <span className="flex items-center gap-1.5 rounded-full border border-[#d9b56f]/45 bg-[#d9b56f]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_12px_28px_rgba(217,181,111,0.28)]">
                  <Gem className="h-3.5 w-3.5" />
                  Melhor oportunidade
                </span>
              )}
              {isClosestToBeach && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f3d797] shadow-[0_12px_28px_rgba(0,0,0,0.32)] backdrop-blur-md">
                  <Waves className="h-3.5 w-3.5" />
                  Mais próximo da praia
                </span>
              )}
            </div>
          )}
        </div>

        <div className={compact ? "space-y-3 p-4" : "space-y-5 p-5"}>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
              <MapPin className="h-3.5 w-3.5" />
              {property.city} / {property.neighborhood}
            </p>
            <h3 className="mt-2 text-base font-semibold text-white">
              {property.name}
            </h3>
            {property.tags && property.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {property.tags.slice(0, compact ? 2 : 4).map((tag) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/65"
                    key={tag}
                  >
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/45">A partir de</p>
              <p className="font-semibold text-white tabular-nums">
                {currency.format(property.initialPrice)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-white/45">
                <CalendarDays className="h-3.5 w-3.5" />
                Entrega
              </p>
              <p className="font-semibold text-white tabular-nums">
                {property.deliveryYear}
              </p>
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm text-white/75">
              <span className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-[#d9b56f]" />
                {property.beachDistance}
              </span>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#d9b56f]" />
                {property.developer}
              </span>
              <span className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                Entrada {currency.format(property.downPayment)}
              </span>
            </div>
          )}
        </div>
      </button>
    </article>
  );
}
