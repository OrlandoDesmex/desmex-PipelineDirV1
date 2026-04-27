"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarEvent } from "@/lib/calendarTypes";
import CalendarioMensual from "./CalendarioMensual";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  event: "Evento", task: "Tarea", call: "Llamada",
};
const TYPE_CHIP: Record<CalendarEvent["type"], string> = {
  event: "bg-blue-100 text-blue-800",
  task:  "bg-amber-100 text-amber-800",
  call:  "bg-emerald-100 text-emerald-800",
};
const TYPE_KPI_BORDER: Record<CalendarEvent["type"], string> = {
  event: "border-l-blue-400",
  task:  "border-l-amber-400",
  call:  "border-l-emerald-400",
};
const TYPE_KPI_RING: Record<CalendarEvent["type"], string> = {
  event: "ring-2 ring-blue-400",
  task:  "ring-2 ring-amber-400",
  call:  "ring-2 ring-emerald-400",
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtTime(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

export default function CalendarioClient() {
  const now = new Date();
  const [year,         setYear]         = useState(now.getFullYear());
  const [month,        setMonth]        = useState(now.getMonth() + 1);
  const [vendedor,     setVendedor]     = useState("Todos");
  const [selectedType, setSelectedType] = useState<CalendarEvent["type"] | null>(null);
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [events,       setEvents]       = useState<CalendarEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState<string[]>([]);
  const [selected,     setSelected]     = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setLoading(true);
    setEvents([]);
    setDateFrom("");
    setDateTo("");
    fetch(`/api/calendario?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data: { events: CalendarEvent[]; errors: string[] }) => {
        setEvents(data.events ?? []);
        setErrors(data.errors ?? []);
      })
      .catch((e) => setErrors([String(e)]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const vendedores = useMemo(
    () => [...new Set(events.map((e) => e.ownerName).filter(Boolean))].sort(),
    [events]
  );

  const filtered = useMemo(() => {
    let result = vendedor === "Todos" ? events : events.filter((e) => e.ownerName === vendedor);
    if (selectedType) result = result.filter((e) => e.type === selectedType);
    if (dateFrom)     result = result.filter((e) => e.startDate >= dateFrom);
    if (dateTo)       result = result.filter((e) => e.startDate <= dateTo);
    return result;
  }, [events, vendedor, selectedType, dateFrom, dateTo]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const firstOfMonth = `${year}-${String(month).padStart(2,"0")}-01`;
  const lastOfMonth  = `${year}-${String(month).padStart(2,"0")}-${String(new Date(year, month, 0).getDate()).padStart(2,"0")}`;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Calendario de Actividades</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Eventos · Tareas · Llamadas de los representantes en NetSuite
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-desmex-border bg-white hover:border-desmex-red hover:text-desmex-red transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-semibold text-stone-700 w-48 text-center">
            {MESES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-desmex-border bg-white hover:border-desmex-red hover:text-desmex-red transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
            className="text-xs px-3 py-1.5 rounded-full border border-desmex-border bg-white text-stone-600 hover:border-desmex-red hover:text-desmex-red transition-colors cursor-pointer ml-1"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Vendedor pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["Todos", ...vendedores].map((v) => (
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

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-medium text-stone-500">Filtrar por fecha:</span>
        <input
          type="date"
          value={dateFrom}
          min={firstOfMonth}
          max={lastOfMonth}
          onChange={(e) => setDateFrom(e.target.value)}
          className="text-xs border border-desmex-border rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:border-desmex-red cursor-pointer"
        />
        <span className="text-xs text-stone-400">—</span>
        <input
          type="date"
          value={dateTo}
          min={firstOfMonth}
          max={lastOfMonth}
          onChange={(e) => setDateTo(e.target.value)}
          className="text-xs border border-desmex-border rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:border-desmex-red cursor-pointer"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-xs px-3 py-1.5 rounded-full border border-desmex-border bg-white text-stone-500 hover:border-desmex-red hover:text-desmex-red transition-colors cursor-pointer"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {/* API errors */}
      {errors.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Advertencias de NetSuite:</p>
          {errors.map((e, i) => <p key={i} className="text-xs text-amber-600 break-all">{e}</p>)}
        </div>
      )}

      {/* KPI strip — click to filter by type */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["event","task","call"] as CalendarEvent["type"][]).map((t) => {
          const count = filtered.filter((e) => e.type === t).length;
          const active = selectedType === t;
          return (
            <button
              key={t}
              onClick={() => setSelectedType(active ? null : t)}
              className={`bg-white rounded-xl border border-desmex-border border-l-4 ${TYPE_KPI_BORDER[t]} shadow-sm p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${active ? TYPE_KPI_RING[t] : ""}`}
            >
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TYPE_CHIP[t]}`}>
                {TYPE_LABEL[t]}s
              </span>
              <span className="text-2xl font-bold text-stone-800">{count}</span>
              {active && (
                <span className="ml-auto text-[10px] text-stone-400">✕ quitar filtro</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="bg-white rounded-xl border border-desmex-border shadow-sm h-96 flex items-center justify-center">
          <p className="text-stone-400 text-sm animate-pulse">Cargando actividades desde NetSuite…</p>
        </div>
      ) : (
        <CalendarioMensual year={year} month={month} events={filtered} onEventClick={setSelected} />
      )}

      {/* Today's activities panel */}
      {!loading && (() => {
        const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const todayEvents = filtered.filter(ev => ev.startDate === todayKey);
        if (todayEvents.length === 0) return null;
        return (
          <div className="mt-6 bg-white rounded-xl border border-desmex-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-desmex-border bg-stone-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-700" suppressHydrationWarning>
                Actividades de hoy — {fmtDate(todayKey)}
              </h2>
              <span className="text-xs text-stone-400">{todayEvents.length} actividad{todayEvents.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="divide-y divide-desmex-border">
              {todayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelected(ev)}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_CHIP[ev.type]}`}>
                      {TYPE_LABEL[ev.type]}
                    </span>
                    <span className="text-xs text-stone-500 tabular-nums">
                      {ev.startTime ?? "—"}{ev.endTime ? ` – ${ev.endTime}` : ""}
                    </span>
                    <span className="text-xs text-stone-400 ml-auto shrink-0">{ev.ownerName}</span>
                  </div>
                  <p className="text-sm font-medium text-stone-800 leading-snug">{ev.title}</p>
                  {(ev.companyName || ev.contactName) && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      {ev.companyName}{ev.companyName && ev.contactName ? " · " : ""}{ev.contactName}
                    </p>
                  )}
                  {ev.message && (
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2">{ev.message}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              selected.type === "event" ? "bg-blue-50"  :
              selected.type === "task"  ? "bg-amber-50" : "bg-emerald-50"
            }`}>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_CHIP[selected.type]}`}>
                {TYPE_LABEL[selected.type]}
              </span>
              <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <h2 className="text-lg font-bold text-stone-800 mb-5 leading-snug">{selected.title}</h2>

              <dl className="space-y-3">
                <div className="flex gap-3">
                  <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Fecha</dt>
                  <dd className="text-sm text-stone-700 capitalize">{fmtDate(selected.startDate)}</dd>
                </div>

                <div className="flex gap-3">
                  <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Horario</dt>
                  <dd className="text-sm text-stone-700">
                    {selected.startTime ?? "—"}{selected.endTime ? ` – ${selected.endTime}` : ""}
                  </dd>
                </div>

                <div className="flex gap-3">
                  <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Representante</dt>
                  <dd className="text-sm text-stone-700">{selected.ownerName}</dd>
                </div>

                {selected.companyName && (
                  <div className="flex gap-3">
                    <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Empresa</dt>
                    <dd className="text-sm text-stone-700">{selected.companyName}</dd>
                  </div>
                )}

                {selected.contactName && (
                  <div className="flex gap-3">
                    <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Contacto</dt>
                    <dd className="text-sm text-stone-700">{selected.contactName}</dd>
                  </div>
                )}

                {selected.location && (
                  <div className="flex gap-3">
                    <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Lugar</dt>
                    <dd className="text-sm text-stone-700">{selected.location}</dd>
                  </div>
                )}

                {selected.status && (
                  <div className="flex gap-3">
                    <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Estado</dt>
                    <dd className="text-sm text-stone-700">{selected.status}</dd>
                  </div>
                )}

                <div className="flex gap-3">
                  <dt className="text-xs text-stone-400 w-28 shrink-0 pt-0.5">Mensaje</dt>
                  <dd className="text-sm text-stone-600 leading-relaxed">
                    {selected.message ?? <span className="text-stone-300 italic">Sin mensaje</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
