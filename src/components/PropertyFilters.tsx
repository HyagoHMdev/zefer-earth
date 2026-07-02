"use client";

import { Building2, MapPin, SlidersHorizontal } from "lucide-react";
import type { PropertyType } from "@/types/property";

type PropertyFiltersProps = {
  cities: string[];
  types: PropertyType[];
  selectedCity: string;
  selectedType: string;
  maxPrice: number;
  highestPrice: number;
  onCityChange: (city: string) => void;
  onTypeChange: (type: string) => void;
  onMaxPriceChange: (price: number) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function PropertyFilters({
  cities,
  types,
  selectedCity,
  selectedType,
  maxPrice,
  highestPrice,
  onCityChange,
  onTypeChange,
  onMaxPriceChange,
}: PropertyFiltersProps) {
  const fieldClass =
    "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none backdrop-blur-xl transition duration-300 hover:border-white/20 focus:border-[#d9b56f] focus:shadow-[0_0_0_3px_rgba(217,181,111,0.12)]";
  const labelClass =
    "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]";

  return (
    <section className="space-y-3 border-y border-white/10 py-4">
      <div>
        <label className={labelClass}>
          <MapPin className="h-3.5 w-3.5" />
          Cidade
        </label>
        <select
          className={fieldClass}
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
        >
          <option value="Todas">Todas</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>
          <Building2 className="h-3.5 w-3.5" />
          Tipo
        </label>
        <select
          className={fieldClass}
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          <option value="Todos">Todos</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Valor max.
          </label>
          <span className="rounded-full border border-[#d9b56f]/25 bg-[#d9b56f]/10 px-2.5 py-1 text-xs font-semibold text-[#f3d797]">
            {currency.format(maxPrice)}
          </span>
        </div>
        <input
          className="zefer-range w-full"
          type="range"
          min={500000}
          max={highestPrice}
          step={50000}
          value={maxPrice}
          onChange={(event) => onMaxPriceChange(Number(event.target.value))}
        />
      </div>
    </section>
  );
}
