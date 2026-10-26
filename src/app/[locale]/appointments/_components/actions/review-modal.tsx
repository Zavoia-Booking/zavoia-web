"use client";

import { useCallback, useId, useRef, useState, type Ref } from "react";
import { Avatar, Button, Icon, Img, useToast } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { TextareaField } from "@/components/ui/textarea-field";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { customerErrorMessage } from "@/lib/api/customer-error-messages";
import { backendCode } from "@/lib/api/error-messages";
import { submitReview } from "@/lib/api/marketplace/customer";
import type { AppointmentDetail, SubmitReviewBody } from "@/lib/api/marketplace/types";
import { getPlainTextApiError, plainTextErrorMessage, REVIEW_COMMENT_MAX_LENGTH, validatePlainText } from "@/lib/validation/free-text";
import { ActionModal } from "./action-modal";
import { canLeaveReview, staffDisplayName } from "./shared";
import styles from "./review-modal.module.css";

type ReviewDict = ReturnType<typeof useTranslation>["dict"]["appointmentActions"]["review"];
interface TargetState { rating: number; comment: string }
interface ReviewTarget {
  key: string;
  professionalId?: number;
  name: string;
  secondary: string | null;
  photo: string | null;
}
const emptyState: TargetState = { rating: 0, comment: "" };
const hasDraft = (state: TargetState) => state.rating > 0 || state.comment.trim().length > 0;
const needsRating = (state: TargetState) => state.rating === 0 && state.comment.trim().length > 0;

function reviewTargets(appointment: AppointmentDetail, unavailable: string): ReviewTarget[] {
  const targets: ReviewTarget[] = appointment.reviews.professionals
    .filter((p) => p.canLeaveReview && p.review == null)
    .map((p) => {
      const member = appointment.staff_users?.find((s) => s.teamMemberId === p.staffId);
      return {
        key: `professional-${p.staffId}`,
        professionalId: p.staffId,
        name: staffDisplayName(member) ?? unavailable,
        secondary: member?.professionalTitle ?? null,
        photo: member?.profileImage ?? null,
      };
    });
  if (appointment.reviews.canLeaveBusinessReview && appointment.reviews.business == null) {
    const name = appointment.location?.name ?? appointment.business?.name ?? "";
    targets.push({
      key: "location",
      name,
      secondary: appointment.business?.name !== name ? appointment.business?.name ?? null : null,
      photo: appointment.location?.profileImage ?? appointment.business?.logo ?? null,
    });
  }
  return targets;
}

/** Each optional subject is edited separately, then all ratings are posted once. */
export function ReviewModal({ appointment, onClose, onChanged, onSubmitted }: {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
  onSubmitted?: (uuid: string) => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentActions.review;
  const toast = useToast();
  // Keep subjects and their order stable for this editing session, as in the app.
  // Current eligibility is still checked before submitting; the server validates targets.
  const [targets] = useState(() => reviewTargets(appointment, dict.appointmentPage.professionalUnavailable));
  const [states, setStates] = useState<Record<string, TargetState>>({});
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstStarRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const inFlightRef = useRef(false);
  const closingRef = useRef(false);
  const handleClosing = useCallback(() => { closingRef.current = true; }, []);
  const active = targets[step];
  const current = active ? states[active.key] ?? emptyState : emptyState;
  const last = step === targets.length - 1;
  const dirty = targets.some((target) => hasDraft(states[target.key] ?? emptyState));
  const ready = canLeaveReview(appointment) && dirty;
  const hasProfessionals = targets.some((target) => target.professionalId != null);

  const navigate = (next: number, focus: "heading" | "rating" | "comment" = "heading") => {
    if (inFlightRef.current || closingRef.current) return;
    setStep(next);
    requestAnimationFrame(() => {
      const element = focus === "rating" ? firstStarRef.current : focus === "comment" ? commentRef.current : headingRef.current;
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "nearest" });
    });
  };

  const validate = (target: ReviewTarget) => {
    const state = states[target.key] ?? emptyState;
    if (validatePlainText(state.comment, { maxLength: REVIEW_COMMENT_MAX_LENGTH })) {
      navigate(targets.indexOf(target), "comment");
      return false;
    }
    if (!needsRating(state)) return true;
    setAttempted((prev) => new Set(prev).add(target.key));
    navigate(targets.indexOf(target), "rating");
    return false;
  };

  const advance = () => {
    if (!active || last || inFlightRef.current || closingRef.current) return;
    if (validate(active)) navigate(step + 1);
  };

  const submit = async () => {
    if (!last || !ready || inFlightRef.current || closingRef.current) return;
    const missing = targets.find((target) => {
      const state = states[target.key] ?? emptyState;
      return needsRating(state) || validatePlainText(state.comment, { maxLength: REVIEW_COMMENT_MAX_LENGTH });
    });
    if (missing && !validate(missing)) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    const body: SubmitReviewBody = { appointmentUuid: appointment.uuid };
    for (const target of targets) {
      const state = states[target.key] ?? emptyState;
      if (!state.rating) continue;
      const comment = state.comment.trim();
      if (target.professionalId != null) {
        (body.professionalRatings ??= []).push({
          professionalId: target.professionalId, rating: state.rating,
          ...(comment ? { comment } : {}),
        });
      } else {
        body.locationRating = state.rating;
        if (comment) body.locationComment = comment;
      }
    }
    try {
      await submitReview(body);
    } catch (e) {
      const validationError = plainTextErrorMessage(getPlainTextApiError(e), dict.textarea, REVIEW_COMMENT_MAX_LENGTH, locale);
      if (validationError || backendCode(e) === "CUSTOMER_REVIEW.E04") {
        setError(validationError ?? customerErrorMessage(e, dict.errors, t.error));
      } else {
        toast(customerErrorMessage(e, dict.errors, t.error), "warn", undefined, "error");
      }
      inFlightRef.current = false;
      setSubmitting(false);
      return;
    }
    onSubmitted?.(appointment.uuid);
    toast(t.successNew, "star");
    onClose();
    void onChanged?.();
  };

  if (!active) return null;
  return (
    <ActionModal
      title={t.titleNew}
      width={540}
      className={styles.modal}
      onClose={onClose}
      dismissible={!submitting}
      onClosing={handleClosing}
      footer={
        <div className={styles.footer}>
          {error && <InlineError>{error}</InlineError>}
          <div className={styles.actions}>
            {step > 0 && (
              <Button kind="ghost" size="lg" disabled={submitting} onClick={() => navigate(step - 1)}>
                <Icon name="back" size={16} />{t.back}
              </Button>
            )}
            <Button
              key={active.key}
              className={styles.primaryAction}
              kind="accent"
              size="lg"
              style={{ border: "none", color: "var(--c-50)" }}
              loading={last ? submitting : undefined}
              disabled={last ? !ready || submitting : submitting}
              onClick={last ? (event) => {
                // A double click on Continue must not post the newly shown step.
                if (event.detail < 2) void submit();
              } : advance}
            >
              {last ? t.submitNew : hasDraft(current) ? t.continue : t.skip}
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.context}>
        <div className={styles.booking}>
          <span>{appointment.primaryItemName || appointment.bookedItemName}</span>
          {appointment.business?.name && <span>{appointment.business.name}</span>}
        </div>
        {targets.length > 1 && (
          <span className={styles.stepCount} role="status" aria-live="polite"
            aria-label={format(t.stepAria, { current: String(step + 1), total: String(targets.length) })}>
            {step + 1} / {targets.length}
          </span>
        )}
      </div>
      {targets.length > 1 && (
        <div className={styles.progress} aria-hidden="true">
          {targets.map((target, index) => <span key={target.key} data-current={index === step} data-visited={index < step} />)}
        </div>
      )}
      <RatingBlock
        key={active.key}
        target={active}
        state={current}
        onChange={(next) => { setStates((prev) => ({ ...prev, [active.key]: next })); setError(null); }}
        t={t}
        disabled={submitting}
        error={attempted.has(active.key) && needsRating(current) ? dict.appointmentPage.reviewRatingRequired : undefined}
        firstStarRef={firstStarRef}
        headingRef={headingRef}
        commentRef={commentRef}
      />
      {last && (
        <div className={styles.notices}>
          <p>{dict.appointmentPage.reviewFinality}{hasProfessionals && <> {t.includeEveryone}</>}</p>
          <p>{t.publicNote}</p>
        </div>
      )}
    </ActionModal>
  );
}

function RatingBlock({ target, state, onChange, t, disabled, error, firstStarRef, headingRef, commentRef }: {
  target: ReviewTarget;
  state: TargetState;
  onChange: (next: TargetState) => void;
  t: ReviewDict;
  disabled: boolean;
  error?: string;
  firstStarRef: Ref<HTMLButtonElement>;
  headingRef: Ref<HTMLHeadingElement>;
  commentRef: Ref<HTMLTextAreaElement>;
}) {
  const labelId = useId();
  const commentId = useId();
  const errorId = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || state.rating;
  const values = ["", t.labelPoor, t.labelFair, t.labelGood, t.labelGreat, t.labelExceptional];
  const label = target.professionalId != null
    ? format(t.professionalLabel, { name: target.name })
    : format(t.businessLabel, { business: target.name });
  return (
    <div className={styles.target} role="group" aria-labelledby={labelId}>
      <div className={styles.identity}>
        {target.professionalId != null
          ? <Avatar src={target.photo ?? undefined} name={target.name} size={64} />
          : <Img src={target.photo ?? undefined} alt={target.name} className={styles.locationImage} />}
        <div>
          <h2 id={labelId} ref={headingRef} tabIndex={-1}>{label}</h2>
          {target.secondary && <p>{target.secondary}</p>}
        </div>
      </div>
      <div className={styles.rating}>
        <div className={styles.stars} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} ref={n === 1 ? firstStarRef : undefined} type="button" disabled={disabled}
              className={`tap ${styles.star}`} aria-label={format(t.starsAria, { n: String(n) })}
              aria-pressed={state.rating === n} aria-describedby={error ? errorId : undefined}
              onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)}
              onClick={() => onChange({ ...state, rating: n })}>
              <Icon name={n <= shown ? "star" : "starO"} size={40}
                color={n <= shown ? "var(--p-500)" : "var(--c-600)"} />
            </button>
          ))}
        </div>
        <span className={styles.value} aria-live="polite">{values[shown]}</span>
      </div>
      {error && <InlineError id={errorId}>{error}</InlineError>}
      <TextareaField id={commentId} ref={commentRef} className={styles.comment}
        label={t.noteLabel} disabled={disabled} maxLength={REVIEW_COMMENT_MAX_LENGTH} rows={3}
        value={state.comment} onChange={(e) => onChange({ ...state, comment: e.target.value })}
        aria-describedby={error ? errorId : undefined} aria-invalid={!!error || undefined} />
    </div>
  );
}
