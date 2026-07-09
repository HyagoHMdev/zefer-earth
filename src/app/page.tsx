"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  List,
  Loader2,
  Map as MapIcon,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radar,
  Route,
} from "lucide-react";
import { CompareModal } from "@/components/CompareModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { MapView } from "@/components/MapView";
import { PropertyCard } from "@/components/PropertyCard";
import { Sidebar } from "@/components/Sidebar";
import { properties as fallbackProperties } from "@/data/properties";
import { getProperties } from "@/services/properties-service";
import type { Property } from "@/types/property";

type SortOption = "recommended" | "lowest-price" | "highest-price" | "soonest";

function getBeachDistanceValue(property: Property) {
  if (property.beachDistance.toLowerCase().includes("frente")) {
    return 0;
  }

  return Number(property.beachDistance.match(/\d+/)?.[0] ?? Infinity);
}

export default function Home() {
  const [propertyList, setPropertyList] =
    useState<Property[]>(fallbackProperties);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedType, setSelectedType] = useState("Todos");
  const [maxPrice, setMaxPrice] = useState(
    Math.max(...fallbackProperties.map((property) => property.initialPrice)),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    fallbackProperties[0].id,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"mapa" | "lista">("lista");
  const [corretor, setCorretor] = useState<string | null>(null);
  const [corretorWa, setCorretorWa] = useState<string | null>(null);
  const [leadProperty, setLeadProperty] = useState<Property | null>(null);

  // Tag do corretor via link (?c=Nome&w=NUMERO): atribui o lead e roteia o
  // WhatsApp para o celular do corretor que compartilhou o mapa.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCorretor(params.get("c") ?? params.get("corretor"));
    const wa = (params.get("w") ?? "").replace(/\D/g, "");
    setCorretorWa(wa || null);
  }, []);

  const waHref = (property: Property) => {
    if (corretorWa) {
      const msg = encodeURIComponent(
        `Olá! Tenho interesse no ${property.name} (Smart Map Zefer).`,
      );
      return `https://wa.me/${corretorWa}?text=${msg}`;
    }
    return property.whatsappUrl ?? "";
  };

  const withTag = (url: string) => {
    const params = new URLSearchParams();
    if (corretor) params.set("c", corretor);
    if (corretorWa) params.set("w", corretorWa);
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setIsLoadingProperties(true);

      const nextProperties = await getProperties();

      if (cancelled) {
        return;
      }

      const nextHighestPrice = Math.max(
        ...nextProperties.map((property) => property.initialPrice),
        0,
      );

      setPropertyList(nextProperties);
      setMaxPrice(nextHighestPrice);
      setSelectedPropertyId(nextProperties[0]?.id ?? fallbackProperties[0].id);
      setIsUsingFallback(
        nextProperties.length === 0 ||
          nextProperties.every((property) => property.source !== "admin-api"),
      );
      setIsLoadingProperties(false);
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  const highestPrice = useMemo(
    () => Math.max(...propertyList.map((property) => property.initialPrice), 0),
    [propertyList],
  );

  const cities = useMemo(
    () => Array.from(new Set(propertyList.map((property) => property.city))),
    [propertyList],
  );

  const types = useMemo(
    () => Array.from(new Set(propertyList.map((property) => property.type))),
    [propertyList],
  );

  const bestOpportunityId = useMemo(
    () =>
      propertyList.reduce((best, property) =>
        property.initialPrice < best.initialPrice ? property : best,
      ).id,
    [propertyList],
  );

  const closestToBeachId = useMemo(
    () =>
      propertyList.reduce((closest, property) =>
        getBeachDistanceValue(property) < getBeachDistanceValue(closest)
          ? property
          : closest,
      ).id,
    [propertyList],
  );

  const filteredProperties = useMemo(
    () => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchingProperties = propertyList.filter((property) => {
        const matchesCity =
          selectedCity === "Todas" || property.city === selectedCity;
        const matchesType =
          selectedType === "Todos" || property.type === selectedType;
        const matchesPrice = property.initialPrice <= maxPrice;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          property.name.toLowerCase().includes(normalizedSearch);

        return matchesCity && matchesType && matchesPrice && matchesSearch;
      });

      return [...matchingProperties].sort((left, right) => {
        if (sortOption === "lowest-price") {
          return left.initialPrice - right.initialPrice;
        }

        if (sortOption === "highest-price") {
          return right.initialPrice - left.initialPrice;
        }

        if (sortOption === "soonest") {
          return left.deliveryYear - right.deliveryYear;
        }

        return 0;
      });
    },
    [maxPrice, propertyList, searchTerm, selectedCity, selectedType, sortOption],
  );

  const selectedProperty =
    filteredProperties.find((property) => property.id === selectedPropertyId) ??
    filteredProperties[0] ??
    null;

  const comparisonProperties = useMemo(
    () =>
      comparisonIds
        .map((id) => propertyList.find((property) => property.id === id))
        .filter((property): property is Property => Boolean(property)),
    [comparisonIds, propertyList],
  );

  const handleSelectProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
  };

  const handleToggleComparison = (property: Property) => {
    setComparisonIds((currentIds) => {
      if (currentIds.includes(property.id)) {
        return currentIds.filter((id) => id !== property.id);
      }

      if (currentIds.length >= 3) {
        return currentIds;
      }

      return [...currentIds, property.id];
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#030303] text-white lg:h-screen lg:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,181,111,0.16),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(135deg,#030303,#080808_48%,#010101)]" />
      {isSidebarOpen ? (
        <div className="relative z-30 flex h-full w-full shrink-0 transition-all duration-300 lg:w-[340px]">
          <Sidebar
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            cities={cities}
            types={types}
            selectedCity={selectedCity}
            selectedType={selectedType}
            maxPrice={maxPrice}
            highestPrice={highestPrice}
            searchTerm={searchTerm}
            sortOption={sortOption}
            bestOpportunityId={bestOpportunityId}
            closestToBeachId={closestToBeachId}
            onCityChange={setSelectedCity}
            onTypeChange={setSelectedType}
            onMaxPriceChange={setMaxPrice}
            onSearchTermChange={setSearchTerm}
            onSortOptionChange={setSortOption}
            onSelectProperty={handleSelectProperty}
          />
          <button
            className="absolute right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-white/70 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-[#d9b56f]/60 hover:text-[#d9b56f]"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Recolher filtros e lista"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          className="absolute left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9b56f]/35 bg-black/45 text-[#f3d797] shadow-[0_18px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[#d9b56f]/10"
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir filtros e lista"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      <section className="relative flex min-h-0 flex-1 flex-col">
        <header className="z-20 flex flex-col gap-3 border-b border-white/10 bg-black/35 px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between lg:px-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b56f]">
              <Radar className="h-4 w-4" />
              Penha / Balneario Picarras / Porto Belo / Itapema / Navegantes
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold text-white md:text-[28px]">
              Curadoria premium de empreendimentos no litoral norte
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.05] p-1">
              <button
                type="button"
                onClick={() => setViewMode("mapa")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "mapa"
                    ? "bg-[#d9b56f] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <MapIcon className="h-4 w-4" /> Mapa
              </button>
              <button
                type="button"
                onClick={() => setViewMode("lista")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "lista"
                    ? "bg-[#d9b56f] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <List className="h-4 w-4" /> Lista
              </button>
            </div>
            <button
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9b56f]/30 bg-[#d9b56f]/10 px-3.5 py-2.5 text-sm font-medium text-[#f3d797] shadow-[0_14px_35px_rgba(217,181,111,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#d9b56f]/15"
              type="button"
              onClick={() => setComparisonOpen(true)}
            >
              <BarChart3 className="h-4 w-4" />
              Comparador ({comparisonIds.length}/3)
            </button>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm font-medium text-white/70">
              <Route className="h-4 w-4 text-[#d9b56f]" />
              {isUsingFallback ? "Fallback mockado" : "Dados Admin API"}
            </div>
            {corretor && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9b56f]/30 bg-[#d9b56f]/10 px-3.5 py-2.5 text-sm font-medium text-[#f3d797]">
                Corretor: {corretor}
              </div>
            )}
          </div>
        </header>

        {isLoadingProperties && (
          <div className="z-20 flex items-center gap-3 border-b border-white/10 bg-black/35 px-5 py-3 text-sm text-white/70 backdrop-blur-2xl lg:px-8">
            <Loader2 className="h-4 w-4 animate-spin text-[#d9b56f]" />
            Carregando empreendimentos do Supabase...
          </div>
        )}

        {viewMode === "mapa" ? (
          <div className="relative flex min-h-0 flex-1">
            <MapView
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              onSelectProperty={handleSelectProperty}
            />
            {selectedProperty && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4">
                <div className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProperty.imageUrl}
                    alt=""
                    className="hidden h-16 w-24 shrink-0 rounded-xl object-cover sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {selectedProperty.name}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {selectedProperty.neighborhood} · {selectedProperty.city} ·{" "}
                      {selectedProperty.beachDistance}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLeadProperty(selectedProperty)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#d9b56f] px-3 py-2 text-sm font-bold text-black transition hover:bg-[#f3d797]"
                    >
                      <MessageCircle className="h-4 w-4" /> Tenho interesse
                    </button>
                    {waHref(selectedProperty) && (
                      <a
                        href={waHref(selectedProperty)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#d9b56f] hover:text-[#d9b56f] sm:inline-flex"
                      >
                        WhatsApp
                      </a>
                    )}
                    {selectedProperty.detailsUrl && (
                      <Link
                        href={withTag(selectedProperty.detailsUrl)}
                        className="hidden rounded-xl border border-[#d9b56f]/35 bg-[#d9b56f]/10 px-3 py-2 text-sm font-semibold text-[#f3d797] transition hover:bg-[#d9b56f]/15 md:inline-flex"
                      >
                        Detalhes
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-7">
          {filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-white/70 backdrop-blur-xl">
              Nenhum empreendimento encontrado para os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProperties.map((property) => {
                const isComparing = comparisonIds.includes(property.id);
                const limitReached =
                  comparisonIds.length >= 3 && !isComparing;

                return (
                  <div key={property.id} className="flex flex-col gap-2.5">
                    <PropertyCard
                      property={property}
                      isSelected={property.id === selectedPropertyId}
                      isBestOpportunity={property.id === bestOpportunityId}
                      isClosestToBeach={property.id === closestToBeachId}
                      onSelect={handleSelectProperty}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition duration-300 ${
                          isComparing
                            ? "border-[#d9b56f]/60 bg-[#d9b56f]/15 text-[#f3d797]"
                            : limitReached
                              ? "cursor-not-allowed border-white/10 bg-white/[0.04] text-white/35"
                              : "border-white/15 bg-black/20 text-white hover:-translate-y-0.5 hover:border-[#d9b56f] hover:text-[#d9b56f]"
                        }`}
                        type="button"
                        onClick={() => handleToggleComparison(property)}
                        disabled={limitReached}
                      >
                        <Plus className="h-4 w-4" />
                        {isComparing
                          ? "No comparador"
                          : limitReached
                            ? "Limite de 3"
                            : "Comparar"}
                      </button>
                      {property.detailsUrl ? (
                        <Link
                          className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9b56f]/35 bg-[#d9b56f]/10 px-3 py-2.5 text-sm font-semibold text-[#f3d797] transition duration-300 hover:-translate-y-0.5 hover:bg-[#d9b56f]/15"
                          href={withTag(property.detailsUrl)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver detalhes
                        </Link>
                      ) : (
                        <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white/35">
                          <ExternalLink className="h-4 w-4" />
                          Sem detalhes
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}
      </section>

      {comparisonOpen && (
        <CompareModal
          properties={comparisonProperties}
          onClose={() => setComparisonOpen(false)}
          onRemove={(propertyId) =>
            setComparisonIds((currentIds) =>
              currentIds.filter((id) => id !== propertyId),
            )
          }
        />
      )}

      {leadProperty && (
        <LeadCaptureModal
          property={leadProperty}
          corretor={corretor}
          onClose={() => setLeadProperty(null)}
        />
      )}
    </main>
  );
}
