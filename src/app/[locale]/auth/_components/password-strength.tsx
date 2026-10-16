"use client";

import { Icon } from "@/components/ui/icon";

export type PasswordStrengthDict = {
  label: string;
  met: string;
  unmet: string;
  ratings: {
    veryWeak: string;
    weak: string;
    fair: string;
    strong: string;
    veryStrong: string;
    excellent: string;
  };
  rules: {
    minLength: string;
    lowercase: string;
    uppercase: string;
    number: string;
    special: string;
  };
};

// Mirrors the marketplace password policy (PASSWORD_REGEX in register-form):
// any non-alphanumeric character counts as the special character.
const RULES = [
  { key: "minLength", test: (p: string) => p.length >= 8 },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p) },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { key: "number", test: (p: string) => /\d/.test(p) },
  { key: "special", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

type RatingKey = keyof PasswordStrengthDict["ratings"];

const LEVELS: {
  max: number;
  rating: RatingKey;
  text: string;
  fill: string;
  pill: string;
}[] = [
  {
    max: 20,
    rating: "veryWeak",
    text: "text-[var(--s-error-600)]",
    fill: "bg-[var(--s-error-600)]",
    pill: "bg-[var(--s-error-100)] text-[var(--s-error-600)]",
  },
  {
    max: 40,
    rating: "weak",
    text: "text-orange-700",
    fill: "bg-orange-500",
    pill: "bg-orange-500/15 text-orange-600",
  },
  {
    max: 60,
    rating: "fair",
    text: "text-yellow-800",
    fill: "bg-yellow-500",
    pill: "bg-yellow-500/20 text-yellow-700",
  },
  {
    max: 80,
    rating: "strong",
    text: "text-emerald-700",
    fill: "bg-emerald-500",
    pill: "bg-emerald-500/15 text-emerald-700",
  },
  {
    max: 100,
    rating: "veryStrong",
    text: "text-green-700",
    fill: "bg-green-600",
    pill: "bg-green-600/15 text-green-700",
  },
];

export function PasswordStrength({
  password,
  dict,
  variant,
  id,
  expanded = false,
  onExpandedChange,
}: {
  password: string;
  dict: PasswordStrengthDict;
  variant: "panel" | "bar" | "inline";
  id?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const met = RULES.map((rule) => rule.test(password));
  const score = Math.round((met.filter(Boolean).length / RULES.length) * 100);
  const level = LEVELS.find((l) => score <= l.max) ?? LEVELS[LEVELS.length - 1];

  if (variant === "inline") {
    return (
      <details
        open={expanded}
        onToggle={(event) => onExpandedChange?.(event.currentTarget.open)}
        className="mt-1"
      >
        <summary
          aria-label={password ? `${dict.label}: ${dict.ratings[level.rating]}` : dict.label}
          className="min-h-8 cursor-pointer list-none rounded-[6px] py-1.5 text-xs text-c-600 [&::-webkit-details-marker]:hidden"
        >
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 font-medium">{dict.label}</span>
            {password && (
              <span className={`shrink-0 font-medium ${level.text}`}>
                {dict.ratings[level.rating]}
              </span>
            )}
            <Icon
              name="chevD"
              size={13}
              className={expanded ? "rotate-180" : undefined}
            />
          </span>
          {password && (
            <span
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
              aria-valuetext={dict.ratings[level.rating]}
              aria-label={dict.label}
              className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-c-200"
            >
              <span
                className={`block h-full w-full origin-left rounded-full ${level.fill}`}
                style={{ transform: `scaleX(${score / 100})` }}
              />
            </span>
          )}
        </summary>
        <ul id={id} className="space-y-1 py-1 text-xs leading-4 text-c-600">
          {RULES.map((rule, index) => (
            <li key={rule.key} className="flex items-start gap-2">
              <Icon
                name={met[index] ? "check" : "x"}
                size={13}
                className={`mt-0.5 ${met[index] ? "text-[var(--s-success-600)]" : "text-c-600"}`}
              />
              <span className="min-w-0">
                <span className="sr-only">{met[index] ? dict.met : dict.unmet}: </span>
                {dict.rules[rule.key]}
              </span>
            </li>
          ))}
        </ul>
      </details>
    );
  }

  if (variant === "bar") {
    return (
      <div className="w-full">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">{dict.label}</span>
          <span className={`font-medium ${level.text}`}>
            {dict.ratings[level.rating]}
          </span>
        </div>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-[rgba(28,28,26,0.08)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-label={dict.label}
        >
          <div
            className={`h-full rounded-full transition-all ${level.fill}`}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 rounded-[10px] border border-[rgba(28,28,26,0.14)] bg-white p-3 shadow-[var(--sh-md)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{dict.label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${level.pill}`}
        >
          {score === 100 ? dict.ratings.excellent : dict.ratings[level.rating]}
        </span>
      </div>
      <div className="mb-2 h-px w-full bg-[rgba(28,28,26,0.14)]" />
      <ul className="space-y-1 text-xs">
        {RULES.map((rule, i) => (
          <li key={rule.key} className="flex items-center gap-2">
            <span
              className={
                met[i] ? "text-emerald-500" : "text-[var(--s-error-600)]"
              }
            >
              <Icon name={met[i] ? "check" : "x"} size={12} />
            </span>
            <span className={met[i] ? "text-ink" : "text-c-600"}>
              {dict.rules[rule.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
