/** RFC 5545: UTC instants, escaped TEXT and content lines folded at 75 octets. */
export interface AppointmentCalendarEvent {
  uuid: string;
  title: string;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  pending: boolean;
  venue?: string | null;
  address?: string | null;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function utc(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (octets + length > 75) {
      parts.push(current);
      current = " ";
      octets = 1;
    }
    current += char;
    octets += length;
  }
  parts.push(current);
  return parts.join("\r\n");
}

export function appointmentCalendar(event: AppointmentCalendarEvent): string {
  const location = [event.venue, event.address].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zavoia//Appointments//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${escapeText(event.uuid)}@zavoia`, `DTSTAMP:${utc(event.updatedAt)}`,
    `DTSTART:${utc(event.startsAt)}`, `DTEND:${utc(event.endsAt)}`, `SUMMARY:${escapeText(event.title)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    `STATUS:${event.pending ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT", "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
}

export function downloadAppointmentCalendar(event: AppointmentCalendarEvent): void {
  const blob = new Blob([appointmentCalendar(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `zavoia-${event.uuid.replace(/[^a-zA-Z0-9_-]/g, "")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
