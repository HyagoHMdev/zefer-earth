"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
  Radar,
  Route,
} from "lucide-react";
import { CompareModal } from "@/components/CompareModal";
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
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

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
  const selectedIsComparing = selectedProperty
    ? comparisonIds.includes(selectedProperty.id)
    : false;
  const comparisonLimitReached =
    comparisonIds.length >= 3 && !selectedIsComparing;

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

  const buildWhatsAppUrl = (property: Property) => {
    const phone =
      property.whatsappUrl.replace(/\D/g, "") ||
      (process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "").replace(/\D/g, "");
    const message = `Olá, tenho interesse no empreendimento ${property.name} em ${property.city}. Gostaria de mais informações.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#030303] text-white lg:h-screen lg:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,181,111,0.16),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(135deg,#030303,#080808_48%,#010101)]" />
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

      <section className="relative flex min-h-0 flex-1 flex-col">
        <header className="z-20 flex flex-col gap-4 border-b border-white/10 bg-black/35 px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b56f]">
              <Radar className="h-4 w-4" />
              Penha / Balneario Picarras / Porto Belo / Itapema / Navegantes
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold text-white md:text-3xl">
              Curadoria premium de empreendimentos no litoral norte
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9b56f]/30 bg-[#d9b56f]/10 px-4 py-3 text-sm font-medium text-[#f3d797] shadow-[0_14px_35px_rgba(217,181,111,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#d9b56f]/15"
              type="button"
              onClick={() => setComparisonOpen(true)}
            >
              <BarChart3 className="h-4 w-4" />
              Comparador ({comparisonIds.length}/3)
            </button>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/70">
              <Route className="h-4 w-4 text-[#d9b56f]" />
              {isUsingFallback ? "Fallback mockado" : "Dados Admin API"}
            </div>
          </div>
        </header>

        {isLoadingProperties && (
          <div className="z-20 flex items-center gap-3 border-b border-white/10 bg-black/35 px-5 py-3 text-sm text-white/70 backdrop-blur-2xl lg:px-8">
            <Loader2 className="h-4 w-4 animate-spin text-[#d9b56f]" />
            Carregando empreendimentos do Supabase...
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          <MapView
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={handleSelectProperty}
          />

          <aside className="z-20 border-l border-white/10 bg-white/[0.07] p-4 shadow-[-24px_0_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl lg:w-[370px] lg:overflow-y-auto lg:p-5">
            {selectedProperty ? (
              <div
                key={selectedProperty.id}
                className="zefer-detail-enter space-y-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9b56f]">
                    Empreendimento selecionado
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Detalhes comerciais
                  </h2>
                </div>
                <PropertyCard
                  property={selectedProperty}
                  isBestOpportunity={selectedProperty.id === bestOpportunityId}
                  isClosestToBeach={selectedProperty.id === closestToBeachId}
                />

                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 ${
                    selectedIsComparing
                      ? "border-[#d9b56f]/60 bg-[#d9b56f]/15 text-[#f3d797]"
                      : comparisonLimitReached
                        ? "cursor-not-allowed border-white/10 bg-white/[0.04] text-white/35"
                        : "border-white/15 bg-black/20 text-white hover:-translate-y-0.5 hover:border-[#d9b56f] hover:text-[#d9b56f]"
                  }`}
                  type="button"
                  onClick={() => handleToggleComparison(selectedProperty)}
                  disabled={comparisonLimitReached}
                >
                  <Plus className="h-4 w-4" />
                  {selectedIsComparing
                    ? "Remover do comparador"
                    : comparisonLimitReached
                      ? "Limite de 3 empreendimentos"
                      : "Adicionar ao comparador"}
                </button>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  {selectedProperty.detailsUrl && (
                    <Link
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[#d9b56f]/35 bg-[#d9b56f]/10 px-4 py-3 text-center font-semibold text-[#f3d797] transition duration-300 hover:-translate-y-0.5 hover:bg-[#d9b56f]/15"
                      href={selectedProperty.detailsUrl}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver detalhes
                    </Link>
                  )}
                  {(
                    selectedProperty.whatsappUrl ||
                    process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP
                  ) ? (
                    <a
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#d9b56f] px-4 py-3 text-center font-semibold text-black shadow-[0_18px_45px_rgba(217,181,111,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f1cf86]"
                      href={buildWhatsAppUrl(selectedProperty)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Falar com especialista
                    </a>
                  ) : (
                    <button
                      className="flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white/35"
                      type="button"
                      disabled
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp indisponível
                    </button>
                  )}
                  {selectedProperty.pdfUrl ? (
                    <a
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-center font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#d9b56f] hover:text-[#d9b56f]"
                      href={selectedProperty.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      Ver apresentação
                    </a>
                  ) : (
                    <button
                      className="flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white/35"
                      type="button"
                      disabled
                    >
                      <FileText className="h-4 w-4" />
                      Apresentação indisponível
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-white/70 backdrop-blur-xl">
                Nenhum empreendimento encontrado para os filtros atuais.
              </div>
            )}
          </aside>
        </div>
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
    </main>
  );
}
