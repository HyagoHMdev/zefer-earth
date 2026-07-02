"use client";

import {
  Building2,
  Crown,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { PropertyFilters } from "@/components/PropertyFilters";
import { PropertyCard } from "@/components/PropertyCard";
import type { Property, PropertyType } from "@/types/property";

type SortOption = "recommended" | "lowest-price" | "highest-price" | "soonest";

type SidebarProps = {
  properties: Property[];
  selectedProperty: Property | null;
  cities: string[];
  types: PropertyType[];
  selectedCity: string;
  selectedType: string;
  maxPrice: number;
  highestPrice: number;
  searchTerm: string;
  sortOption: SortOption;
  bestOpportunityId: string;
  closestToBeachId: string;
  onCityChange: (city: string) => void;
  onTypeChange: (type: string) => void;
  onMaxPriceChange: (price: number) => void;
  onSearchTermChange: (term: string) => void;
  onSortOptionChange: (sortOption: SortOption) => void;
  onSelectProperty: (property: Property) => void;
};

export function Sidebar({
  properties,
  selectedProperty,
  cities,
  types,
  selectedCity,
  selectedType,
  maxPrice,
  highestPrice,
  searchTerm,
  sortOption,
  bestOpportunityId,
  closestToBeachId,
  onCityChange,
  onTypeChange,
  onMaxPriceChange,
  onSearchTermChange,
  onSortOptionChange,
  onSelectProperty,
}: SidebarProps) {
  const controlClass =
    "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none backdrop-blur-xl transition duration-300 placeholder:text-white/35 hover:border-white/20 focus:border-[#d9b56f] focus:shadow-[0_0_0_3px_rgba(217,181,111,0.12)]";

  return (
    <aside className="relative z-30 flex h-full w-full flex-col border-r border-white/10 bg-white/[0.075] p-3 text-white shadow-[24px_0_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:w-[340px] lg:p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#d9b56f]/10" />
      <header className="space-y-4 pb-4">
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d9b56f]/45 bg-[#d9b56f]/[0.12] shadow-[0_18px_45px_rgba(217,181,111,0.16)]">
            <Crown className="h-4 w-4 text-[#f3d797]" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#d9b56f]">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma imobiliaria
            </p>
            <h1 className="text-xl font-semibold text-white">
              Zefer Smart Map
            </h1>
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-black/25 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
              <Building2 className="h-4 w-4 text-[#d9b56f]" />
            </div>
            <div>
              <p className="text-sm text-white/55">Empreendimentos encontrados</p>
              <p className="text-xl font-semibold text-white">
                {properties.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        <PropertyFilters
          cities={cities}
          types={types}
          selectedCity={selectedCity}
          selectedType={selectedType}
          maxPrice={maxPrice}
          highestPrice={highestPrice}
          onCityChange={onCityChange}
          onTypeChange={onTypeChange}
          onMaxPriceChange={onMaxPriceChange}
        />
      </div>

      <section className="relative space-y-3 border-b border-white/10 py-4">
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
            <Search className="h-3.5 w-3.5" />
            Buscar empreendimento
          </label>
          <input
            className={controlClass}
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Ex: Aurum, Harbor, Signature"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b56f]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Ordenar
          </label>
          <select
            className={controlClass}
            value={sortOption}
            onChange={(event) =>
              onSortOptionChange(event.target.value as SortOption)
            }
          >
            <option value="recommended">Curadoria Zefer</option>
            <option value="lowest-price">Menor valor</option>
            <option value="highest-price">Maior valor</option>
            <option value="soonest">Entrega mais próxima</option>
          </select>
        </div>
      </section>

      <div className="relative min-h-0 flex-1 space-y-2.5 overflow-y-auto pt-4 zefer-scroll">
        {properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard
              compact
              key={property.id}
              property={property}
              isSelected={selectedProperty?.id === property.id}
              isBestOpportunity={property.id === bestOpportunityId}
              isClosestToBeach={property.id === closestToBeachId}
              onSelect={onSelectProperty}
            />
          ))
        ) : (
          <div className="zefer-detail-enter rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-white/65 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d9b56f]/30 bg-[#d9b56f]/10">
              <Search className="h-4 w-4 text-[#d9b56f]" />
            </div>
            <p className="text-base font-semibold text-white">
              Nenhum empreendimento encontrado
            </p>
            <p className="mt-2 leading-6 text-white/55">
              Ajuste a busca, reduza os filtros ou aumente o valor máximo para
              voltar a visualizar oportunidades no mapa.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
