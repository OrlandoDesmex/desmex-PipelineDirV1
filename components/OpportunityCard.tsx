"use client";

import { Opportunity } from "@/lib/parseExcel";

interface OpportunityCardProps {
  opp: Opportunity;
  colorHex: string;
}

function fmtUSD(n: number | null) {
  if (!n && n !== 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

const CAPTACION_COLORS: Record<string, string> = {
  "Llamada en Frío (Prospección)": "bg-sky-50 text-sky-700",
  "Referido (Cliente)":            "bg-emerald-50 text-emerald-700",
  "Reactivación de Base de Datos": "bg-amber-50 text-amber-700",
  "Redes Sociales / Digital":      "bg-violet-50 text-violet-700",
  "Feria / Evento":                "bg-rose-50 text-rose-700",
};

function captacionClass(medio: string | null) {
  if (!medio) return "";
  return CAPTACION_COLORS[medio] ?? "bg-stone-50 text-stone-600";
}

export default function OpportunityCard({ opp, colorHex }: OpportunityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-desmex-border shadow-sm hover:shadow-md transition-shadow p-3 cursor-default">
      {/* Empresa + ID */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">
          {opp.empresa || opp.nombre}
        </p>
        <span className="text-[10px] text-stone-400 whitespace-nowrap pt-0.5 shrink-0">
          {opp.id}
        </span>
      </div>

      {/* Nombre del prospecto */}
      {opp.nombre && opp.empresa && opp.nombre !== opp.empresa && (
        <p className="text-xs text-stone-500 truncate mb-2">{opp.nombre}</p>
      )}

      {/* Valor + Fecha */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-stone-700">{fmtUSD(opp.valor)}</p>
        <p className="text-xs text-stone-400">{fmtDate(opp.fechaContacto)}</p>
      </div>

      {/* Probabilidad */}
      {opp.probabilidad !== null && (
        <div className="mb-2">
          <div className="flex items-center mb-1">
            <span className="text-[10px] text-stone-400">
              {opp.probabilidad}% cierre
            </span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full opacity-70"
              style={{
                width: `${Math.min(100, opp.probabilidad)}%`,
                backgroundColor: colorHex,
              }}
            />
          </div>
        </div>
      )}

      {/* Medio de captación */}
      {opp.medioCaptacion && (
        <p
          className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block truncate max-w-full ${captacionClass(
            opp.medioCaptacion
          )}`}
        >
          {opp.medioCaptacion}
        </p>
      )}

      {/* Representante de ventas */}
      <p className="text-[10px] text-stone-400 mt-1.5 truncate">
        👤 {opp.vendedor}
      </p>
    </div>
  );
}
