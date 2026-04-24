import * as XLSX from "xlsx";
import path from "path";

export interface Opportunity {
  id: string;
  nombre: string;
  empresa: string;
  ubicacion: string | null;
  producto: string | null;
  etapa: string;
  fechaContacto: string | null; // ISO date string YYYY-MM-DD
  valor: number | null; // USD
  probabilidad: number | null; // 0-100
  medioCaptacion: string | null;
  vendedor: string;
}

export interface StageData {
  etapa: string;
  order: number;
  bgClass: string;
  colorHex: string;
  opportunities: Opportunity[];
  totalValor: number;
  count: number;
}

export interface PipelineData {
  opportunities: Opportunity[];
  stages: StageData[];
  vendedores: string[];
  totalRecords: number;
  lastRead: string; // ISO datetime
}

// Excel serial date → ISO string (handles Excel's 1900-leap-year bug)
function xlDateToISO(serial: number): string {
  const date = new Date((serial - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0];
}

const STAGE_STYLES: Record<number, { bgClass: string; colorHex: string }> = {
  1:  { bgClass: "bg-slate-400",   colorHex: "#94A3B8" },
  2:  { bgClass: "bg-sky-500",     colorHex: "#0EA5E9" },
  3:  { bgClass: "bg-blue-500",    colorHex: "#3B82F6" },
  4:  { bgClass: "bg-indigo-500",  colorHex: "#6366F1" },
  5:  { bgClass: "bg-violet-500",  colorHex: "#8B5CF6" },
  6:  { bgClass: "bg-purple-500",  colorHex: "#A855F7" },
  7:  { bgClass: "bg-amber-400",   colorHex: "#FBBF24" },
  8:  { bgClass: "bg-orange-400",  colorHex: "#FB923C" },
  9:  { bgClass: "bg-yellow-500",  colorHex: "#EAB308" },
  10: { bgClass: "bg-rose-500",    colorHex: "#F43F5E" },
  11: { bgClass: "bg-emerald-500", colorHex: "#10B981" },
  12: { bgClass: "bg-green-600",   colorHex: "#16A34A" },
  13: { bgClass: "bg-teal-500",    colorHex: "#14B8A6" },
  14: { bgClass: "bg-red-400",     colorHex: "#F87171" },
  15: { bgClass: "bg-stone-400",   colorHex: "#A8A29E" },
};

const FALLBACK_STYLE = { bgClass: "bg-gray-400", colorHex: "#9CA3AF" };

export function parsePipeline(): PipelineData {
  const excelPath = path.join(
    process.cwd(),
    "data",
    "PIPE LINE PROCESO COMERCIAL - Ventas TA.xlsx"
  );

  const wb = XLSX.readFile(excelPath);
  const sheets = wb.SheetNames.filter(
    (s) => !s.toLowerCase().includes("copia")
  );

  const opportunities: Opportunity[] = [];

  sheets.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
    }) as (string | number | null)[][];

    rows.slice(1).forEach((r) => {
      if (!r[0]) return;

      const rawValor = r[7];
      const valor =
        typeof rawValor === "number"
          ? rawValor
          : typeof rawValor === "string" && rawValor !== "|"
          ? parseFloat(rawValor) || null
          : null;

      const rawProb = r[8];
      let probabilidad: number | null = null;
      if (typeof rawProb === "number") {
        probabilidad = rawProb <= 1 ? Math.round(rawProb * 100) : rawProb;
      } else if (typeof rawProb === "string") {
        const p = parseFloat(rawProb);
        if (!isNaN(p)) probabilidad = p <= 1 ? Math.round(p * 100) : p;
      }

      opportunities.push({
        id: String(r[0]),
        nombre: String(r[1] || ""),
        empresa: String(r[2] || "").trim(),
        ubicacion: r[3] ? String(r[3]) : null,
        producto: r[4] ? String(r[4]) : null,
        etapa: String(r[5] || "Sin etapa"),
        fechaContacto:
          typeof r[6] === "number" ? xlDateToISO(r[6]) : null,
        valor,
        probabilidad,
        medioCaptacion: r[9] ? String(r[9]) : null,
        vendedor: r[10] ? String(r[10]) : sheetName,
      });
    });
  });

  // Group by stage
  const stageMap = new Map<string, Opportunity[]>();
  for (const opp of opportunities) {
    if (!stageMap.has(opp.etapa)) stageMap.set(opp.etapa, []);
    stageMap.get(opp.etapa)!.push(opp);
  }

  const stages: StageData[] = Array.from(stageMap.entries())
    .map(([etapa, opps]) => {
      const order = parseInt(etapa.split(".")[0]) || 999;
      const style = STAGE_STYLES[order] ?? FALLBACK_STYLE;
      return {
        etapa,
        order,
        bgClass: style.bgClass,
        colorHex: style.colorHex,
        opportunities: opps,
        totalValor: opps.reduce((s, o) => s + (o.valor ?? 0), 0),
        count: opps.length,
      };
    })
    .sort((a, b) => a.order - b.order);

  const vendedores = [...new Set(opportunities.map((o) => o.vendedor))].sort();

  return {
    opportunities,
    stages,
    vendedores,
    totalRecords: opportunities.length,
    lastRead: new Date().toISOString(),
  };
}
