/**
 * Marketplace APPOINTMENTS endpoints (`/marketplace/appointments/*`).
 *
 * Auth: required (apiFetch attaches the Bearer token + handles 401 refresh).
 * Envelope: ALL WRAPPED `{ message, data }` — every function unwraps to `data`.
 */

import { apiFetch } from "@/lib/api/http";
import { buildQuery } from "./query";
import type {
  AppointmentDetail,
  AppointmentList,
  BookAppointmentBody,
  BookAppointmentResult,
  CancelAppointmentBody,
  CancelAppointmentResult,
  Envelope,
  ListAppointmentsParams,
  RescheduleAppointmentBody,
  RescheduleAppointmentResult,
} from "./types";

/** GET /marketplace/appointments/list — WRAPPED; returns { upcoming, past }. */
export async function listAppointments(
  params: ListAppointmentsParams = {},
): Promise<AppointmentList> {
  const query = buildQuery({
    status: params.status,
    limit: params.limit,
    offset: params.offset,
  });
  const res = await apiFetch<Envelope<AppointmentList>>(
    `/marketplace/appointments/list${query}`,
    { method: "GET" },
  );
  return res.data;
}

/** GET /marketplace/appointments/:uuid — WRAPPED; returns AppointmentDetail. */
export async function getAppointment(
  uuid: string,
): Promise<AppointmentDetail> {
  const res = await apiFetch<Envelope<AppointmentDetail>>(
    `/marketplace/appointments/${uuid}`,
    { method: "GET" },
  );
  return res.data;
}

/**
 * POST /marketplace/appointments/book — WRAPPED; returns { appointments }.
 * Pass `idempotencyKey` to dedupe retries (sent as the `idempotency-key` header).
 */
export async function bookAppointment(
  body: BookAppointmentBody,
  idempotencyKey?: string,
): Promise<BookAppointmentResult> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

  const res = await apiFetch<Envelope<BookAppointmentResult>>(
    "/marketplace/appointments/book",
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** POST /marketplace/appointments/cancel — WRAPPED; returns cancel result. */
export async function cancelAppointment(
  body: CancelAppointmentBody,
): Promise<CancelAppointmentResult> {
  const res = await apiFetch<Envelope<CancelAppointmentResult>>(
    "/marketplace/appointments/cancel",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** POST /marketplace/appointments/reschedule — WRAPPED; returns reschedule result. */
export async function rescheduleAppointment(
  body: RescheduleAppointmentBody,
): Promise<RescheduleAppointmentResult> {
  const res = await apiFetch<Envelope<RescheduleAppointmentResult>>(
    "/marketplace/appointments/reschedule",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}
