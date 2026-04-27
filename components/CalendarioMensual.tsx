"use client";

import { CalendarEvent } from "@/lib/calendarTypes";

interface CalendarioMensualProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TYPE_CHIP: Record<CalendarEvent["type"], string> = {
  event: "bg-blue-100 text-blue-800 border border-blue-200",
  task:  "bg-amber-100 text-amber-800 border border-amber-200",
  call:  "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

const TYPE_DOT: Record<CalendarEvent["type"], string> = {
  event: "bg-blue-500",
  task:  "bg-amber-500",
  call:  "bg-emerald-500",
};

// Manual ISO to avoid toISOString() timezone shifts
function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const totalDays = new Date(year, month, 0).getDate();
  // Mon=0 … Sun=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarioMensual({ year, month, events, onEventClick }: CalendarioMensualProps) {
  const cells = buildGrid(year, month);
  const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

  return (
    <div className="bg-white rounded-xl border border-desmex-border shadow-sm overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-desmex-border bg-stone-50">
        {DAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-desmex-border">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`blank-${i}`} className="min-h-[110px] bg-stone-50/50" />;
          }

          const key = dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
          const dayEvents = events.filter(ev => ev.startDate?.startsWith(key));
          const isToday   = key === todayKey;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={key}
              className={`min-h-[110px] p-1.5 flex flex-col ${isWeekend ? "bg-stone-50/70" : "bg-white"}`}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  isToday ? "bg-desmex-red text-white" : "text-stone-400"
                }`}>
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    title={ev.title}
                    className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate leading-snug cursor-pointer hover:opacity-75 transition-opacity ${TYPE_CHIP[ev.type]}`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${TYPE_DOT[ev.type]}`} />
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 4 && (
                  <p className="text-[10px] text-stone-400 px-1.5">+{dayEvents.length - 4} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-4 py-2.5 border-t border-desmex-border bg-stone-50">
        {(["event","task","call"] as CalendarEvent["type"][]).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${TYPE_DOT[t]}`} />
            <span className="text-[11px] text-stone-500">
              {t === "event" ? "Evento" : t === "task" ? "Tarea" : "Llamada"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
