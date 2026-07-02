"use client";

import { Building2, MapPin, X } from "lucide-react";
import type { Property } from "@/types/property";

type CompareModalProps = {
  properties: Property[];
  onClose: () => void;
  onRemove: (propertyId: string) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const rows: Array<{
  label: string;
  getValue: (property: Property) => string;
}> = [
  {
    label: "Valor",
    getValue: (property) => currency.format(property.initialPrice),
  },
  {
    label: "Entrada",
    getValue: (property) => currency.format(property.downPayment),
  },
  {
    label: "Entrega",
    getValue: (property) => String(property.deliveryYear),
  },
  {
    label: "Cidade",
    getValue: (property) => property.city,
  },
  {
    label: "Bairro",
    getValue: (property) => property.neighborhood,
  },
  {
    label: "Tipo",
    getValue: (property) => property.type,
  },
  {
    label: "Distância da praia",
    getValue: (property) => property.beachDistance,
  },
  {
    label: "Construtora",
    getValue: (property) => property.developer,
  },
];

export function CompareModal({
  properties,
  onClose,
  onRemove,
}: CompareModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-xl md:items-center md:p-6">
      <section className="zefer-detail-enter max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/92 text-white shadow-[0_30px_120px_rgba(0,0,0,0.72)] backdrop-blur-2xl">
        <header className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d9b56f]">
              <Building2 className="h-4 w-4" />
              Comparador comercial
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Compare até 3 empreendimentos
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition hover:border-[#d9b56f]/60 hover:text-[#d9b56f]"
            type="button"
            onClick={onClose}
            aria-label="Fechar comparador"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {properties.length === 0 ? (
          <div className="p-6 text-white/65">
            Adicione empreendimentos para iniciar a comparação.
          </div>
        ) : (
          <div className="overflow-auto zefer-scroll">
            <div
              className="grid min-w-[760px]"
              style={{
                gridTemplateColumns: `190px repeat(${properties.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="border-b border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-white/55">
                Criterio
              </div>
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="border-b border-l border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {property.name}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-[#d9b56f]">
                        <MapPin className="h-3.5 w-3.5" />
                        {property.city}
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-white/10 p-1.5 text-white/55 transition hover:border-[#d9b56f]/60 hover:text-[#d9b56f]"
                      type="button"
                      onClick={() => onRemove(property.id)}
                      aria-label={`Remover ${property.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {rows.map((row) => (
                <div className="contents" key={row.label}>
                  <div className="border-b border-white/10 p-4 text-sm font-semibold text-white/55">
                    {row.label}
                  </div>
                  {properties.map((property) => (
                    <div
                      key={`${row.label}-${property.id}`}
                      className="border-b border-l border-white/10 p-4 text-sm font-semibold text-white"
                    >
                      {row.getValue(property)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
