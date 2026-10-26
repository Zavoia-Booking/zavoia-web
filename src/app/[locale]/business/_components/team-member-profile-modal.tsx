"use client";

import { ProfessionalProfile, type ProfessionalProfileProps } from "./professional-profile";

export type { TeamMemberSeed } from "./professional-profile";

type Props = Omit<ProfessionalProfileProps, "presentation" | "initialProfile" | "onClose"> & {
  onClose: () => void;
};

/** Preserve every contextual entry point while sharing the profile with its public page. */
export function TeamMemberProfileModal(props: Props) {
  return <ProfessionalProfile key={props.member.id} {...props} presentation="modal" />;
}
