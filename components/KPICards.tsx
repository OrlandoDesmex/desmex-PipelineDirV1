"use client";

interface KPICardsProps {
  totalValor: number;
  totalOpps: number;
  avgProbabilidad: number;
  etapasActivas: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function KPICards({
  totalValor,
  totalOpps,
  avgProbabilidad,
  etapasActivas,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-desmex-border shadow-sm p-4">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
          Valor total pipeline
        </p>
        <p className="text-2xl font-bold text-stone-800">{fmt(totalValor)}</p>
        <p className="text-xs text-stone-400 mt-1">USD</p>
      </div>

      <div className="bg-white rounded-xl border border-desmex-border shadow-sm p-4">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
          Oportunidades
        </p>
        <p className="text-2xl font-bold text-stone-800">{totalOpps}</p>
        <p className="text-xs text-stone-400 mt-1">activas</p>
      </div>

      <div className="bg-white rounded-xl border border-desmex-border shadow-sm p-4">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
          Probabilidad promedio
        </p>
        <p className="text-2xl font-bold text-stone-800">
          {avgProbabilidad.toFixed(0)}%
        </p>
        <p className="text-xs text-stone-400 mt-1">de cierre</p>
      </div>

      <div className="bg-white rounded-xl border border-desmex-border shadow-sm p-4">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
          Etapas activas
        </p>
        <p className="text-2xl font-bold text-stone-800">{etapasActivas}</p>
        <p className="text-xs text-stone-400 mt-1">en el pipeline</p>
      </div>
    </div>
  );
}
