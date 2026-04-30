"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { PipelineData, StageData } from "@/lib/parseExcel";
import KPICards from "./KPICards";
import PipelineBoard from "./PipelineBoard";

interface PipelineClientProps {
  data: PipelineData;
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isWon(etapa: string): boolean {
  const n = norm(etapa);
  return n.includes("kickoff") || n.includes("inicio");
}

function stagePct(etapa: string): 30 | 50 | 90 | null {
  const n = norm(etapa);
  if (n.includes("levantamiento") || n.includes("visita") || n.includes("diagnostico") ||
      n.includes("diseno") || n.includes("solucion") || n.includes("ingenieria")) return 30;
  if (n.includes("estimacion") || n.includes("cotizacion") ||
      n.includes("propuesta") || n.includes("aclaracion") || n.includes("ajuste")) return 50;
  if (n.includes("negociacion") || n.includes("aprobacion") || n.includes("cierre")) return 90;
  return null;
}

function fmtLastRead(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PipelineClient({ data }: PipelineClientProps) {
  const allStageNames = useMemo(
    () => data.stages.map((s) => s.etapa),
    [data.stages]
  );

  const [vendedor, setVendedor] = useState<string>("Todos");
  const [selectedPct, setSelectedPct] = useState<30 | 50 | 90 | null>(null);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(
    () => new Set(allStageNames)
  );
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setStageDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onTopScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (boardScrollRef.current && topScrollRef.current)
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  const onBoardScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (topScrollRef.current && boardScrollRef.current)
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  function toggleStage(etapa: string) {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      next.has(etapa) ? next.delete(etapa) : next.add(etapa);
      return next;
    });
  }

  function selectAllStages() {
    setSelectedStages(new Set(allStageNames));
  }

  function clearAllStages() {
    setSelectedStages(new Set());
  }

  const filteredStages = useMemo<StageData[]>(() => {
    return data.stages
      .filter((stage) => selectedStages.has(stage.etapa))
      .map((stage) => ({
        ...stage,
        opportunities:
          vendedor === "Todos"
            ? stage.opportunities
            : stage.opportunities.filter((o) => o.vendedor === vendedor),
      }))
      .map((stage) => ({
        ...stage,
        count: stage.opportunities.length,
        totalValor: stage.opportunities.reduce((s, o) => s + (o.valor ?? 0), 0),
      }))
      .filter((stage) => !hideEmpty || stage.count > 0)
      .filter((stage) => selectedPct === null || stagePct(stage.etapa) === selectedPct);
  }, [data.stages, vendedor, hideEmpty, selectedStages, selectedPct]);

  const kpis = useMemo(() => {
    const allOpps = filteredStages.flatMap((s) => s.opportunities);
    const withProb = allOpps.filter((o) => o.probabilidad !== null);

    // Conversion: won opps / total opps filtered by vendor only (ignore stage/pct filters)
    const oppsByVendor = data.stages.flatMap((s) =>
      vendedor === "Todos" ? s.opportunities : s.opportunities.filter((o) => o.vendedor === vendedor)
    );
    const wonOpps = data.stages
      .filter((s) => isWon(s.etapa))
      .flatMap((s) =>
        vendedor === "Todos" ? s.opportunities : s.opportunities.filter((o) => o.vendedor === vendedor)
      );
    const totalOppsAll = oppsByVendor.length;
    const wonCount = wonOpps.length;

    return {
      totalValor: allOpps.reduce((s, o) => s + (o.valor ?? 0), 0),
      totalOpps: allOpps.length,
      avgProbabilidad:
        withProb.length > 0
          ? withProb.reduce((s, o) => s + (o.probabilidad ?? 0), 0) / withProb.length
          : 0,
      etapasActivas: filteredStages.filter((s) => s.count > 0).length,
      conversionRate: totalOppsAll > 0 ? Math.round((wonCount / totalOppsAll) * 1000) / 10 : 0,
      wonOpps: wonCount,
      totalOppsAll,
    };
  }, [filteredStages, data.stages, vendedor]);

  const [boardScrollWidth, setBoardScrollWidth] = useState(0);
  useEffect(() => {
    const el = boardScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoardScrollWidth(el.scrollWidth));
    ro.observe(el);
    setBoardScrollWidth(el.scrollWidth);
    return () => ro.disconnect();
  }, [filteredStages]);

  const etapasSeleccionadas = selectedStages.size;
  const todasSeleccionadas = etapasSeleccionadas === allStageNames.length;

  return (
    <div>
      {/* Header, filtros y KPIs — centrados con max-width */}
      <div className="max-w-screen-2xl mx-auto px-6 pt-6">
        {/* Título + checkbox ocultar vacías */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              Pipeline Ventas TA
            </h1>
            <p className="text-sm text-stone-400 mt-0.5" suppressHydrationWarning>
              Actualizado: {fmtLastRead(data.lastRead)} ·{" "}
              {data.totalRecords} registros totales
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideEmpty}
                onChange={(e) => setHideEmpty(e.target.checked)}
                className="accent-desmex-red"
              />
              Ocultar etapas vacías
            </label>
          </div>
        </div>

        {/* Fila de filtros: vendedor + etapas */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Vendedor pills */}
          <div className="flex flex-wrap gap-2">
            {["Todos", ...data.vendedores].map((v) => (
              <button
                key={v}
                onClick={() => setVendedor(v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  vendedor === v
                    ? "bg-desmex-red text-white border-desmex-red"
                    : "bg-white text-stone-600 border-desmex-border hover:border-desmex-red hover:text-desmex-red"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-desmex-border hidden md:block" />

          {/* Filtro por % de avance */}
          <div className="flex gap-2">
            {([30, 50, 90] as const).map((pct) => (
              <button
                key={pct}
                onClick={() => setSelectedPct(selectedPct === pct ? null : pct)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer font-semibold ${
                  selectedPct === pct
                    ? "bg-desmex-red text-white border-desmex-red"
                    : "bg-white text-stone-600 border-desmex-border hover:border-desmex-red hover:text-desmex-red"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-desmex-border hidden md:block" />

          {/* Dropdown de etapas */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setStageDropdownOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                todasSeleccionadas
                  ? "bg-white text-stone-600 border-desmex-border hover:border-desmex-red hover:text-desmex-red"
                  : "bg-desmex-red text-white border-desmex-red"
              }`}
            >
              Etapas
              {!todasSeleccionadas && (
                <span className="bg-white/25 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  {etapasSeleccionadas}
                </span>
              )}
              <svg
                className={`w-3 h-3 transition-transform ${stageDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {stageDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-desmex-border rounded-xl shadow-lg w-72 py-2">
                {/* Acciones rápidas */}
                <div className="flex items-center justify-between px-3 pb-2 border-b border-desmex-border">
                  <span className="text-xs text-stone-400">
                    {etapasSeleccionadas} de {allStageNames.length} seleccionadas
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllStages}
                      className="text-[11px] text-desmex-red hover:underline cursor-pointer"
                    >
                      Todas
                    </button>
                    <button
                      onClick={clearAllStages}
                      className="text-[11px] text-stone-400 hover:underline cursor-pointer"
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                {/* Lista de etapas */}
                <div className="max-h-72 overflow-y-auto">
                  {data.stages.map((stage) => (
                    <label
                      key={stage.etapa}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStages.has(stage.etapa)}
                        onChange={() => toggleStage(stage.etapa)}
                        className="accent-desmex-red shrink-0"
                      />
                      {/* Dot de color de la etapa */}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.colorHex }}
                      />
                      <span className="text-xs text-stone-700 leading-tight">
                        {stage.etapa}
                      </span>
                      <span className="ml-auto text-[10px] text-stone-400 shrink-0">
                        {stage.count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <KPICards
          totalValor={kpis.totalValor}
          totalOpps={kpis.totalOpps}
          avgProbabilidad={kpis.avgProbabilidad}
          etapasActivas={kpis.etapasActivas}
          conversionRate={kpis.conversionRate}
          wonOpps={kpis.wonOpps}
          totalOppsAll={kpis.totalOppsAll}
        />
      </div>

      {/* Board — ancho completo del viewport, scroll horizontal arriba y abajo */}
      {filteredStages.length === 0 ? (
        <div className="text-center py-16 text-stone-400 px-6">
          No hay oportunidades para este filtro.
        </div>
      ) : (
        <>
          {/* Scrollbar superior — espejo del contenido */}
          <div
            ref={topScrollRef}
            className="overflow-x-auto px-6"
            onScroll={onTopScroll}
          >
            <div className="h-[1px]" style={{ width: boardScrollWidth }} />
          </div>

          {/* Board real */}
          <div
            ref={boardScrollRef}
            className="overflow-x-auto px-6 pb-6"
            onScroll={onBoardScroll}
          >
            <PipelineBoard stages={filteredStages} />
          </div>
        </>
      )}
    </div>
  );
}
