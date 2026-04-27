import { NextRequest, NextResponse } from "next/server";
import { suiteQL } from "@/lib/netsuite";
import type { CalendarEvent } from "@/lib/calendarTypes";

export type { CalendarEvent };

function toISO(nsDate: string | null | undefined): string | null {
  if (!nsDate) return null;
  // D/M/YYYY or DD/MM/YYYY (NetSuite day-first format)
  const dmy = nsDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  // YYYY-MM-DD (with optional time)
  if (/^\d{4}-\d{2}-\d{2}/.test(nsDate)) return nsDate.slice(0, 10);
  return null;
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
  return text || null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const firstDay = `${year}-${String(month).padStart(2,"0")}-01`;
  const lastDay  = `${year}-${String(month).padStart(2,"0")}-${String(new Date(year, month, 0).getDate()).padStart(2,"0")}`;

  const events: CalendarEvent[] = [];
  const errors: string[] = [];

  // ── Calendar Events ────────────────────────────────────────────────────────
  // Uses ce.owner (whose calendar it belongs to), not ce.organizer (who created it).
  // An event created by Patricia and assigned to Jonathan appears on Jonathan's calendar.
  try {
    const rows = await suiteQL<Record<string,unknown>>(`
      SELECT
        ce.id,
        ce.title,
        ce.startdate,
        ce.enddate,
        TO_CHAR(ce.starttime, 'HH24:MI') AS startTime,
        TO_CHAR(ce.endtime,   'HH24:MI') AS endTime,
        ce.status,
        ce.location,
        ce.message,
        BUILTIN.DF(ce.owner)   AS ownerName,
        ce.owner               AS ownerId,
        BUILTIN.DF(ce.company) AS companyName,
        BUILTIN.DF(ce.contact) AS contactName
      FROM calendarEvent ce
      WHERE ce.startdate >= TO_DATE('${firstDay}', 'YYYY-MM-DD')
        AND ce.startdate <= TO_DATE('${lastDay}', 'YYYY-MM-DD')
        AND (SELECT e.isinactive FROM entity e WHERE e.id = ce.owner) = 'F'
      ORDER BY ce.startdate ASC, ce.starttime ASC
    `);

    for (const r of rows) {
      const sd = toISO(r.startdate as string);
      if (!sd) continue;
      events.push({
        id:          `evt-${r.id}`,
        title:       String(r.title       ?? "(Sin título)"),
        startDate:   sd,
        endDate:     toISO(r.enddate   as string),
        startTime:   r.starttime ? String(r.starttime) : null,
        endTime:     r.endtime   ? String(r.endtime)   : null,
        status:      String(r.status      ?? "CONFIRMED"),
        location:    r.location    ? String(r.location)    : null,
        message:     stripHtml(r.message as string),
        ownerName:   String(r.ownername   ?? "—"),
        ownerId:     String(r.ownerid     ?? ""),
        companyName: r.companyname ? String(r.companyname) : null,
        contactName: r.contactname ? String(r.contactname) : null,
        type: "event",
      });
    }
  } catch (e) {
    errors.push(`calendarEvent: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  try {
    const rows = await suiteQL<Record<string,unknown>>(`
      SELECT
        t.id,
        t.title,
        t.startdate,
        t.duedate,
        t.status,
        t.message,
        BUILTIN.DF(t.owner)    AS ownerName,
        t.owner                AS ownerId,
        BUILTIN.DF(t.company)  AS companyName,
        BUILTIN.DF(t.contact)  AS contactName
      FROM task t
      WHERE t.startdate >= TO_DATE('${firstDay}', 'YYYY-MM-DD')
        AND t.startdate <= TO_DATE('${lastDay}', 'YYYY-MM-DD')
        AND (SELECT e.isinactive FROM entity e WHERE e.id = t.owner) = 'F'
      ORDER BY t.startdate ASC
    `);

    for (const r of rows) {
      const sd = toISO(r.startdate as string);
      if (!sd) continue;
      events.push({
        id:          `task-${r.id}`,
        title:       String(r.title       ?? "(Sin título)"),
        startDate:   sd,
        endDate:     toISO(r.duedate   as string),
        startTime:   null,
        endTime:     null,
        status:      String(r.status      ?? ""),
        location:    null,
        message:     stripHtml(r.message as string),
        ownerName:   String(r.ownername   ?? "—"),
        ownerId:     String(r.ownerid     ?? ""),
        companyName: r.companyname ? String(r.companyname) : null,
        contactName: r.contactname ? String(r.contactname) : null,
        type: "task",
      });
    }
  } catch (e) {
    errors.push(`task: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Phone Calls ────────────────────────────────────────────────────────────
  try {
    const rows = await suiteQL<Record<string,unknown>>(`
      SELECT
        p.id,
        p.title,
        p.startdate,
        TO_CHAR(p.starttime, 'HH24:MI') AS startTime,
        TO_CHAR(p.endtime,   'HH24:MI') AS endTime,
        p.status,
        p.message,
        BUILTIN.DF(p.owner)    AS ownerName,
        p.owner                AS ownerId,
        BUILTIN.DF(p.company)  AS companyName,
        BUILTIN.DF(p.contact)  AS contactName
      FROM phoneCall p
      WHERE p.startdate >= TO_DATE('${firstDay}', 'YYYY-MM-DD')
        AND p.startdate <= TO_DATE('${lastDay}', 'YYYY-MM-DD')
        AND (SELECT e.isinactive FROM entity e WHERE e.id = p.owner) = 'F'
      ORDER BY p.startdate ASC, p.starttime ASC
    `);

    for (const r of rows) {
      const sd = toISO(r.startdate as string);
      if (!sd) continue;
      events.push({
        id:          `call-${r.id}`,
        title:       String(r.title       ?? "(Sin título)"),
        startDate:   sd,
        endDate:     null,
        startTime:   r.starttime ? String(r.starttime) : null,
        endTime:     r.endtime   ? String(r.endtime)   : null,
        status:      String(r.status      ?? ""),
        location:    null,
        message:     stripHtml(r.message as string),
        ownerName:   String(r.ownername   ?? "—"),
        ownerId:     String(r.ownerid     ?? ""),
        companyName: r.companyname ? String(r.companyname) : null,
        contactName: r.contactname ? String(r.contactname) : null,
        type: "call",
      });
    }
  } catch (e) {
    errors.push(`phoneCall: ${e instanceof Error ? e.message : String(e)}`);
  }

  events.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return NextResponse.json({ events, errors });
}
