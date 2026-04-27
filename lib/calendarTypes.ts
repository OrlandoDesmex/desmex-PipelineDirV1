export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  location: string | null;
  message: string | null;
  ownerName: string;
  ownerId: string;
  companyName: string | null;
  contactName: string | null;
  type: "event" | "task" | "call";
}
