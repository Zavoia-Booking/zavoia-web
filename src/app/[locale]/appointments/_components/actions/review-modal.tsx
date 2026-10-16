"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button, Icon, useToast } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { customerErrorMessage } from "@/lib/api/customer-error-messages";
import { submitReview } from "@/lib/api/marketplace/customer";
import type {
  AppointmentDetail,
  ProfessionalRatingInput,
  SubmitReviewBody,
} from "@/lib/api/marketplace/types";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps, canLeaveReview, staffDisplayName } from "./shared";

type ReviewDict = ReturnType<
  typeof useTranslation
>["dict"]["appointmentActions"]["review"];

/** One editable review target's state (rating + comment). */
interface TargetState {
  rating: number;
  comment: string;
}

/** One create-only submission with optional location and professional ratings. */
export function ReviewModal({
  appointment,
  onClose,
  onChanged,
  onSubmitted,
}: {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
  onSubmitted?: (uuid: string) => void;
}) {
  const { dict } = useTranslation();
  const t = dict.appointmentActions.review;
  const toast = useToast();

  const reviews = appointment.reviews;
  const businessName = appointment.business?.name ?? "";

  const eligible = canLeaveReview(appointment);
  const professionalTargets = useMemo(
    () => reviews.professionals.filter((p) => p.canLeaveReview && p.review == null),
    [reviews.professionals],
  );
  const showBusiness = reviews.canLeaveBusinessReview && reviews.business == null;

  const [businessState, setBusinessState] = useState<TargetState>({
    rating: 0,
    comment: "",
  });
  const [proStates, setProStates] = useState<Record<number, TargetState>>(() => {
    const seed: Record<number, TargetState> = {};
    for (const p of professionalTargets) {
      seed[p.staffId] = { rating: 0, comment: "" };
    }
    return seed;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const closingRef = useRef(false);
  const handleClosing = useCallback(() => {
    closingRef.current = true;
  }, []);

  const mini = apptMiniProps(appointment, dict.common.photo);

  // Ready when at least one rendered target has a rating > 0.
  const ready =
    eligible &&
    ((showBusiness && businessState.rating > 0) ||
      professionalTargets.some((p) => (proStates[p.staffId]?.rating ?? 0) > 0));

  const setProTarget = (staffId: number, next: TargetState) => {
    setProStates((prev) => ({ ...prev, [staffId]: next }));
  };

  const submit = async () => {
    if (!ready || inFlightRef.current || closingRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    const body: SubmitReviewBody = { appointmentUuid: appointment.uuid };

    if (showBusiness && businessState.rating > 0) {
      body.locationRating = businessState.rating;
      const comment = businessState.comment.trim();
      if (comment) body.locationComment = comment;
    }

    const professionalRatings: ProfessionalRatingInput[] = [];
    for (const p of professionalTargets) {
      const st = proStates[p.staffId];
      if (!st || st.rating <= 0) continue;
      const entry: ProfessionalRatingInput = {
        professionalId: p.staffId,
        rating: st.rating,
      };
      const comment = st.comment.trim();
      if (comment) entry.comment = comment;
      professionalRatings.push(entry);
    }
    if (professionalRatings.length > 0) {
      body.professionalRatings = professionalRatings;
    }

    try {
      await submitReview(body);
    } catch (e) {
      // CUSTOMER_REVIEW.* codes ("already reviewed", "not completed yet",
      // "no rating given", "professional not on this appointment") each get
      // their own copy via `customerErrorMessage`; anything unrecognised
      // falls back to this modal's own generic line.
      setError(customerErrorMessage(e, dict.errors, t.error));
      inFlightRef.current = false;
      setSubmitting(false);
      return;
    }

    onSubmitted?.(appointment.uuid);
    toast(t.successNew, "star");
    onClose();
    // The existing detail refresh handles its errors; a confirmed submission
    // must not wait for that request before finishing the interaction.
    void onChanged?.();
  };

  return (
    <ActionModal
      title={t.titleNew}
      subtitle={format(t.sub, { business: businessName })}
      onClose={onClose}
      dismissible={!submitting}
      onClosing={handleClosing}
      footer={
        <>
          <span style={{ flex: 1, fontSize: 12.5, color: "var(--c-500)" }}>
            {t.publicNote}
          </span>
          <Button
            loading={submitting}
          kind="accent"
            size="lg"
            disabled={!ready || submitting}
            onClick={() => void submit()}
          >
            {t.submitNew}
          </Button>
        </>
      }
    >
      <ApptMini {...mini} />

      {error && (
        <InlineError style={{ margin: "14px 0 0" }}>
          {error}
        </InlineError>
      )}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {showBusiness && (
          <RatingBlock
            label={format(t.businessLabel, { business: appointment.location?.name ?? businessName })}
            state={businessState}
            onChange={setBusinessState}
            t={t}
          />
        )}

        {professionalTargets.map((p, idx) => {
          const member = appointment.staff_users?.find(
            (s) => s.teamMemberId === p.staffId,
          );
          const name = staffDisplayName(member) ?? `#${p.staffId}`;
          const state = proStates[p.staffId] ?? { rating: 0, comment: "" };
          return (
            <RatingBlock
              key={p.staffId}
              label={format(t.professionalLabel, { name })}
              state={state}
              onChange={(next) => setProTarget(p.staffId, next)}
              t={t}
              divider={idx > 0 || showBusiness}
            />
          );
        })}
      </div>
    </ActionModal>
  );
}

/**
 * One review target block: a label, an interactive INTEGER 1–5 star input
 * (built locally — `Stars` is display-only and supports halves), the value
 * label, and an optional comment textarea.
 */
function RatingBlock({
  label,
  state,
  onChange,
  t,
  divider,
}: {
  label: string;
  state: TargetState;
  onChange: (next: TargetState) => void;
  t: ReviewDict;
  divider?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || state.rating;
  const valueLabels = [
    "",
    t.labelPoor,
    t.labelFair,
    t.labelGood,
    t.labelGreat,
    t.labelExceptional,
  ];

  return (
    <div
      style={{
        paddingTop: divider ? 22 : 0,
        borderTop: divider ? "1px solid rgba(28,28,26,0.08)" : 0,
      }}
    >
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--c-800)",
          textAlign: "center",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{ display: "flex", gap: 6 }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="tap"
              aria-label={format(t.starsAria, { n: String(n) })}
              aria-pressed={state.rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange({ ...state, rating: n })}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: 2,
                lineHeight: 0,
              }}
            >
              <Icon
                name={n <= shown ? "star" : "starO"}
                size={38}
                color={n <= shown ? "var(--p-500)" : "var(--c-300)"}
              />
            </button>
          ))}
        </div>
        <div
          style={{
            height: 18,
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--c-700)",
            letterSpacing: "-0.01em",
          }}
        >
          {valueLabels[shown] || t.ratePrompt}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={sectionLabel}>{t.noteLabel}</div>
        <textarea
          value={state.comment}
          onChange={(e) => onChange({ ...state, comment: e.target.value })}
          rows={4}
          placeholder={t.notePlaceholder}
          style={{
            width: "100%",
            resize: "vertical",
            minHeight: 96,
            border: "1px solid rgba(28,28,26,0.12)",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            background: "#fff",
            color: "var(--c-900)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--c-500)",
  marginBottom: 8,
};
