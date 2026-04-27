import { parsePipeline } from "@/lib/parseExcel";
import PipelineClient from "@/components/PipelineClient";

// Revalidate every 5 minutes so a page refresh picks up a replaced Excel file
export const revalidate = 300;

export default function PipelinePage() {
  let data;
  try {
    data = parsePipeline();
  } catch (err) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center shadow-sm">
          <p className="text-desmex-red font-semibold text-lg mb-2">
            No se pudo leer el archivo Excel
          </p>
          <p className="text-stone-500 text-sm">
            Asegúrate de que el archivo existe en:
          </p>
          <code className="block mt-2 text-xs bg-stone-50 rounded p-2 text-stone-600 break-all">
            Pipeline1/Excel/PIPE LINE PROCESO COMERCIAL - Ventas TA.xlsx
          </code>
          <p className="text-xs text-stone-400 mt-4">
            {err instanceof Error ? err.message : String(err)}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <PipelineClient data={data} />
    </main>
  );
}
