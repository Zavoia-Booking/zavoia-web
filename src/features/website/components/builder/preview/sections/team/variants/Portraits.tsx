import { TeamCard } from "../parts/TeamCard";
import { MicrositeBookAction } from "../../../shared/actions";
import type { TeamVariantProps } from "../types";
import "./portraits.css";

/** Portraits (free base) — the source's lookbook grid: a 3-up wall of tall photo cards, each a minimal
 *  scrim + rating pill + name. The masked entrance staggers card-by-card on mount. */
export function Portraits({ members, ratings, nameOf, initialsOf, tintOf }: TeamVariantProps) {
  return (
    <div className="mc-team">
      {members.map(({ m, locId }, i) => {
        const r = ratings?.[m.id];
        return (
          <MicrositeBookAction key={`${locId}-${m.id}`} previewTag="div" intent={{ locationId: locId, teamMemberId: m.id }} className="mc-portrait mc-mask-in" aria-label={nameOf(m)} style={{ animationDelay: `${Math.min(i, 7) * 70}ms` }}>
            <TeamCard name={nameOf(m)} initials={initialsOf(m)} image={m.profileImage ?? null} rating={r && r.count > 0 ? r.rating : null} tint={tintOf(m)} />
          </MicrositeBookAction>
        );
      })}
    </div>
  );
}
