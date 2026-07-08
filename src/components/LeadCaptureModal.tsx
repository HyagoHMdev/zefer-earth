"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircle, X } from "lucide-react";
import type { Property } from "@/types/property";

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, "") ?? "";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Captura de lead do Smart Map. Posta em {ADMIN}/api/leads-lp (público, CORS
 * aberto): cria contato + deal no Bitrix e espelha no painel na hora, já com a
 * origem do empreendimento e a tag do corretor.
 */
export function LeadCaptureModal({
  property,
  corretor,
  onClose,
}: {
  property: Property;
  corretor: string | null;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [erro, setErro] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!nome.trim() || status === "sending") return;

    setStatus("sending");
    setErro("");

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/leads-lp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          objetivo: `Interesse no ${property.name}`,
          origem: `Smart Map · ${property.name}${
            corretor ? ` · corretor ${corretor}` : ""
          }`,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setErro(data.error ?? "Não foi possível enviar. Tente de novo.");
      }
    } catch {
      setStatus("error");
      setErro("Sem conexão com o servidor. Tente de novo.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#d9b56f]/25 bg-[#0b0b0b] shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
        <div className="relative border-b border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9b56f]">
            Tenho interesse
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{property.name}</h3>
          <p className="mt-0.5 text-xs text-white/55">
            {property.neighborhood} · {property.city} · {property.beachDistance}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/60 transition hover:border-[#d9b56f]/50 hover:text-[#d9b56f]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "done" ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4ade80]/15 text-[#4ade80]">
              <Check className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Recebemos seu interesse!</p>
            <p className="mt-1 text-sm text-white/60">
              {corretor
                ? `${corretor} vai falar com você em breve.`
                : "Um especialista da Zefer vai falar com você em breve."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl border border-white/15 bg-white/[0.05] py-3 text-sm font-semibold text-white transition hover:border-[#d9b56f]/50"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <p className="text-sm text-white/60">
              Deixe seu contato que a Zefer te manda a apresentação completa e as condições.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">Nome</label>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
                placeholder="Seu nome"
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#d9b56f]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                WhatsApp / telefone
              </label>
              <input
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                inputMode="tel"
                placeholder="(47) 99999-9999"
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#d9b56f]"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-300">{erro}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending" || !nome.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d9b56f] py-3 text-sm font-bold text-black transition hover:bg-[#f3d797] disabled:opacity-60"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" /> Quero saber mais
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-white/35">
              Seus dados vão direto para o time da Zefer. Sem spam.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
