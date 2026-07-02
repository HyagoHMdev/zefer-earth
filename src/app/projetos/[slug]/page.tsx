import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  MessageCircle,
  Waves,
} from "lucide-react";
import { Location3DSection } from "@/components/Location3DSection";
import { getPropertyBySlug } from "@/services/properties-service";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function buildWhatsAppUrl(propertyName: string, city: string, whatsappUrl: string) {
  const phone =
    whatsappUrl.replace(/\D/g, "") ||
    (process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP ?? "").replace(/\D/g, "");
  const message = `Olá, tenho interesse no empreendimento ${propertyName} em ${city}. Gostaria de mais informações.`;

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "";
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const whatsappUrl = buildWhatsAppUrl(
    property.name,
    property.city,
    property.whatsappUrl,
  );

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,181,111,0.18),transparent_30%),linear-gradient(135deg,#050505,#111_52%,#020202)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url(${property.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/82 to-black/35" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 lg:px-8">
          <Link
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white/75 backdrop-blur-xl transition hover:border-[#d9b56f]/60 hover:text-[#d9b56f]"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao mapa
          </Link>

          <div className="grid flex-1 items-end gap-8 lg:grid-cols-[1.1fr_420px]">
            <div className="pb-8">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b56f]">
                <MapPin className="h-4 w-4" />
                {property.city} / {property.neighborhood}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                {property.name}
              </h1>
              {property.headline && (
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                  {property.headline}
                </p>
              )}

              {property.tags && property.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {property.tags.map((tag) => (
                    <span
                      className="rounded-full border border-[#d9b56f]/30 bg-[#d9b56f]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d797]"
                      key={tag}
                    >
                      {tag.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
              <h2 className="text-xl font-semibold">Dados comerciais</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-white/45">Valor inicial</p>
                  <p className="mt-1 font-semibold text-white">
                    {currency.format(property.initialPrice)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-white/45">Entrada</p>
                  <p className="mt-1 font-semibold text-white">
                    {currency.format(property.downPayment)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="flex items-center gap-1 text-white/45">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Entrega
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {property.deliveryYear}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-white/45">Tipo</p>
                  <p className="mt-1 font-semibold text-white">{property.type}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="flex items-center gap-1 text-white/45">
                    <Waves className="h-3.5 w-3.5" />
                    Praia
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {property.beachDistance}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="flex items-center gap-1 text-white/45">
                    <Building2 className="h-3.5 w-3.5" />
                    Construtora
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {property.developer}
                  </p>
                </div>
              </div>

              {property.description && (
                <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                  {property.description}
                </p>
              )}

              <div className="mt-5 grid gap-3">
                {whatsappUrl ? (
                  <a
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#d9b56f] px-4 py-3 text-center font-semibold text-black transition hover:bg-[#f1cf86]"
                    href={whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com especialista
                  </a>
                ) : (
                  <button
                    className="flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white/35"
                    disabled
                    type="button"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp indisponível
                  </button>
                )}

                {property.pdfUrl ? (
                  <a
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-center font-semibold text-white transition hover:border-[#d9b56f] hover:text-[#d9b56f]"
                    href={property.pdfUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="h-4 w-4" />
                    Ver apresentação
                  </a>
                ) : (
                  <button
                    className="flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white/35"
                    disabled
                    type="button"
                  >
                    <FileText className="h-4 w-4" />
                    Apresentação indisponível
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
        <Location3DSection property={property} />
      </section>
    </main>
  );
}
