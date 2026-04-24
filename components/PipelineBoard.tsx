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

export default function PipelineBoard({ stages }: PipelineBoardProps) {
  return (
    <div className="flex gap-3 min-w-max">
      {stages.map((stage) => (
          <div key={stage.etapa} className="w-56 flex-shrink-0 flex flex-col">
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
                <p className="text-white/75 text-[10px] mt-0.5">
                  {fmtUSD(stage.totalValor)}
                </p>
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
        ))}
    </div>
  );
}

