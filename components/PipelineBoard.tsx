"use client";

import { StageData } from "@/lib/parseExcel";
import OpportunityCard from "./OpportunityCard";

interface PipelineBoardProps {
  stages: StageData[];
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

// Normalize: lowercase + strip accents for reliable keyword matching
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Group by stage name keywords — matches the exact grouping the director requested
function stageGroup(etapa: string): number {
  const n = norm(etapa);

  // 30%: Levantamiento de Requerimientos | Visita Tecnica / Diagnóstico en Sitio | Diseño de Solución / Pre-Ingeniería
  if (n.includes("levantamiento") || n.includes("visita") || n.includes("diagnostico") ||
      (n.includes("diseno") || n.includes("solucion") || n.includes("ingenieria"))) {
    return 0;
  }

  // 50%: Estimación / Cotización | Propuesta Enviada | Aclaraciones / Ajuste de Propuesta
  if (n.includes("estimacion") || n.includes("cotizacion") ||
      n.includes("propuesta") || n.includes("aclaracion") || n.includes("ajuste")) {
    return 1;
  }

  // 90%: Negociación | Aprobación Interna (Go/No-GO) | Cierre de Venta (Contrato / OC)
  if (n.includes("negociacion") || n.includes("aprobacion") || n.includes("cierre")) {
    return 2;
  }

  // 100%: Kickoff / inicio de Proyecto
  if (n.includes("kickoff") || n.includes("inicio")) {
    return 3;
  }

  return -1;
}

const GROUPS = [
  {
    pct: 30,
    label: "Identificación y Análisis",
    headerBg:   "bg-sky-600",
    borderTop:  "border-t-sky-500",
  },
  {
    pct: 50,
    label: "Propuesta",
    headerBg:   "bg-indigo-600",
    borderTop:  "border-t-indigo-500",
  },
  {
    pct: 90,
    label: "Negociación y Cierre",
    headerBg:   "bg-amber-500",
    borderTop:  "border-t-amber-400",
  },
  {
    pct: 100,
    label: "Proyecto Iniciado",
    headerBg:   "bg-emerald-600",
    borderTop:  "border-t-emerald-500",
  },
] as const;

export default function PipelineBoard({ stages }: PipelineBoardProps) {
  // Split stages into groups 0-3 and ungrouped (-1)
  const grouped: StageData[][] = [[], [], [], []];
  const ungrouped: StageData[] = [];

  for (const s of stages) {
    const g = stageGroup(s.etapa);
    if (g >= 0) grouped[g].push(s);
    else ungrouped.push(s);
  }

  // Split ungrouped into stages that appear before the groups vs after
  const minGroupOrder = Math.min(...grouped.flat().map((s) => s.order).filter((n) => n < 999));
  const preBand  = ungrouped.filter((s) => s.order < minGroupOrder);
  const postBand = ungrouped.filter((s) => s.order >= minGroupOrder);

  return (
    <div className="flex gap-5 min-w-max items-start">
      {/* Pre-group stages (Prospección, Contacto Inicial, Calificación, etc.) — no banner */}
      {preBand.map((stage) => (
        <StageColumn key={stage.etapa} stage={stage} />
      ))}

      {/* All 4 percentage groups with banner */}
      {GROUPS.map((group, gi) => {
        const cols = grouped[gi];
        if (cols.length === 0) return null;
        const groupCount = cols.reduce((s, c) => s + c.count, 0);
        const groupValue = cols.reduce((s, c) => s + c.totalValor, 0);

        return (
          <div key={group.pct} className="flex flex-col gap-0">
            <div className={`${group.headerBg} rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white leading-none">{group.pct}%</span>
                <div className="w-px h-5 bg-white/30" />
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">{group.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">{groupCount} oportunidad{groupCount !== 1 ? "es" : ""}</span>
                {groupValue > 0 && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="text-xs font-bold text-white">{fmtUSD(groupValue)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 bg-white/50 rounded-b-xl border border-t-0 border-desmex-border p-2">
              {cols.map((stage) => (
                <StageColumn key={stage.etapa} stage={stage} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Post-group stages (Ganado, Perdido, etc.) — no banner */}
      {postBand.map((stage) => (
        <StageColumn key={stage.etapa} stage={stage} />
      ))}
    </div>
  );
}

function StageColumn({ stage }: { stage: StageData }) {
  return (
    <div className="w-56 flex-shrink-0 flex flex-col">
      {/* Column header */}
      <div className={`${stage.bgClass} rounded-t-lg px-3 py-2`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2">
            {stage.etapa.replace(/^\d+\.\s*/, "")}
          </p>
          <span className="ml-2 bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
            {stage.count}
          </span>
        </div>
        {stage.totalValor > 0 && (
          <p className="text-white/75 text-[10px] mt-0.5">{fmtUSD(stage.totalValor)}</p>
        )}
      </div>

      {/* Cards */}
      <div className="bg-stone-50 rounded-b-lg border border-t-0 border-desmex-border flex flex-col gap-2 p-2 min-h-[80px]">
        {stage.opportunities.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-lg p-3 text-center">
            <p className="text-xs text-stone-400">Sin oportunidades</p>
          </div>
        ) : (
          stage.opportunities.map((opp, i) => (
            <OpportunityCard
              key={`${stage.etapa}-${opp.id}-${i}`}
              opp={opp}
              colorHex={stage.colorHex}
            />
          ))
        )}
      </div>
    </div>
  );
}
