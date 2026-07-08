/**
 * Marketplace SUPPORT endpoints (`/marketplace/support/*`).
 *
 * Auth: required (apiFetch attaches the Bearer token + handles 401 refresh),
 * except `createGuestTicket`, which hits the PUBLIC `/marketplace/public/support/*`
 * surface and works signed out.
 * Envelope: ALL WRAPPED `{ message, data }` — every function unwraps to `data`.
 */

import { apiFetch } from "@/lib/api/http";
import type {
  AddTicketMessageBody,
  CreateGuestTicketBody,
  CreateTicketBody,
  Envelope,
  GuestTicketReceipt,
  Ticket,
  TicketListItem,
} from "./types";

/** GET /marketplace/support/tickets — WRAPPED; returns (Ticket & { hasUnread })[]. */
export async function listTickets(): Promise<TicketListItem[]> {
  const res = await apiFetch<Envelope<TicketListItem[]>>(
    "/marketplace/support/tickets",
    { method: "GET" },
  );
  return res.data;
}

/** POST /marketplace/support/tickets — WRAPPED; returns the created Ticket. */
export async function createTicket(dto: CreateTicketBody): Promise<Ticket> {
  const res = await apiFetch<Envelope<Ticket>>(
    "/marketplace/support/tickets",
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
  return res.data;
}

/**
 * POST /marketplace/public/support/tickets — PUBLIC (no auth), WRAPPED.
 * Guest issue reports: rate-limited to 3/hour per IP (429 beyond that); the
 * backend confirms by email and replies go to `dto.email` only.
 */
export async function createGuestTicket(
  dto: CreateGuestTicketBody,
): Promise<GuestTicketReceipt> {
  const res = await apiFetch<Envelope<GuestTicketReceipt>>(
    "/marketplace/public/support/tickets",
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
  return res.data;
}

/** GET /marketplace/support/tickets/:id — WRAPPED; returns the Ticket. */
export async function getTicket(id: number): Promise<Ticket> {
  const res = await apiFetch<Envelope<Ticket>>(
    `/marketplace/support/tickets/${id}`,
    { method: "GET" },
  );
  return res.data;
}

/** POST /marketplace/support/tickets/:id/messages — WRAPPED; returns the updated Ticket. */
export async function addTicketMessage(
  id: number,
  dto: AddTicketMessageBody,
): Promise<Ticket> {
  const res = await apiFetch<Envelope<Ticket>>(
    `/marketplace/support/tickets/${id}/messages`,
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
  return res.data;
}

/** PUT /marketplace/support/tickets/:id/close — WRAPPED; returns the updated Ticket. */
export async function closeTicket(id: number): Promise<Ticket> {
  const res = await apiFetch<Envelope<Ticket>>(
    `/marketplace/support/tickets/${id}/close`,
    { method: "PUT" },
  );
  return res.data;
}
